import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './product.schema';
import { ScraperStatus, ScraperStatusDocument } from './scraper-status.schema';
import { QueryProductDto } from './dto/query-product.dto';
import { SearchService } from '../search/search.service';
import { EventsGateway } from '../events/events.gateway';
import { CategoryMapperService } from '../search/category-mapper.service';
import { TAXONOMY, mapCategory } from './taxonomy';
import { Model } from 'mongoose';



@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(ScraperStatus.name) private scraperStatusModel: Model<ScraperStatusDocument>,
        private readonly searchService: SearchService,
        private readonly eventsGateway: EventsGateway,
        private readonly categoryMapper: CategoryMapperService,
    ) {
        this.setupChangeStream();
    }

    private setupChangeStream() {
        try {
            this.productModel.watch().on('change', async (data) => {
                if (data.operationType === 'insert' || data.operationType === 'update') {
                    const stats = await this.getStats();
                    this.eventsGateway.emitStatsUpdated(stats);
                }
            });

            this.scraperStatusModel.watch().on('change', async (data) => {
                const stats = await this.getStats();
                this.eventsGateway.emitStatsUpdated(stats);
            });
        } catch (error) {
            console.warn('MongoDB Change Streams not available (likely standalone MongoDB). Real-time updates via DB changes disabled.', error.message);
        }
    }

    async getStats() {
        const totalProducts = await this.productModel.countDocuments();

        const byStore = await this.productModel.aggregate([
            { $group: { _id: '$store', count: { $sum: 1 } } }
        ]);

        const priceHistoryStats = await this.productModel.aggregate([
            {
                $bucket: {
                    groupBy: '$price',
                    boundaries: [0, 500000, 1000000, 2000000, 5000000, 10000000],
                    default: 'Other',
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        const recentlyUpdated = await this.productModel
            .find()
            .sort({ lastUpdated: -1 })
            .limit(10)
            .exec();

        const scraperStatus = await this.scraperStatusModel.find().exec();

        const addedToday = await this.productModel.countDocuments({
            lastUpdated: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        return {
            totalProducts,
            totalStores: byStore.length,
            byStore: byStore.map(s => ({ name: s._id, value: s.count })),
            priceRanges: priceHistoryStats.map(r => ({ range: r._id === 'Other' ? '5000+' : `${r._id / 1000}`, count: r.count })),
            recentlyUpdated,
            scraperStatus,
            addedToday,
            lastScrapeTime: scraperStatus.length > 0 ? Math.max(...scraperStatus.map(s => s.lastScrapeTime.getTime())) : null
        };
    }

    async updateScraperStatus(store: string, status: string, count?: number, message?: string) {
        return this.scraperStatusModel.findOneAndUpdate(
            { store },
            {
                status,
                message,
                lastScrapeTime: new Date(),
                ...(count !== undefined && { productCount: count })
            },
            { upsert: true, new: true }
        ).exec();
    }

    async findAll(query: QueryProductDto) {
        const {
            store,
            search,
            category,
            parentCategory,
            subcategory,
            minPrice,
            maxPrice,
            source,
            page = 1,
            limit = 20,
        } = query;

        const filter: Record<string, any> = {};

        // Default to scraped products to separate official stores from user marketplace
        // Also include products where source is not yet defined
        if (!source || source === 'scraped') {
            filter.source = { $in: ['scraped', null, undefined] };
        } else {
            filter.source = source;
        }

        if (store) filter.store = store;
        if (category) filter.category = category;
        if (parentCategory) filter.parentCategory = parentCategory;
        if (subcategory) filter.subcategory = subcategory;
        if (search) filter.name = { $regex: search, $options: 'i' };

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await this.productModel.countDocuments(filter);
        const products = await this.productModel
            .find(filter)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(Number(limit))
            .exec();

        return {
            data: products,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        };
    }
    async indexAllProducts() {
        const products = await this.productModel.find().exec();
        await this.searchService.indexAllProducts(products);
        return { message: `Indexed ${products.length} products` };
    }

    async migrateDatabase() {
        console.log('Starting one-time migration to two-level taxonomy with AI support...');
        const products = await this.productModel.find().exec();
        let updated = 0;

        for (const p of products) {
            // Priority 1: Keyword match (fast)
            const { parent: kwParent, subcategory: kwSub } = mapCategory(p.category || '');
            
            let finalParent = kwParent;
            let finalSub = kwSub;

            // Priority 2: AI refinement if keyword match is "Divers" or "UNKNOWN"
            if (finalParent === 'Électroménager & Autres' && finalSub === 'Divers') {
                const mapped = await this.categoryMapper.map(p.name, p.category);
                if (mapped.parent !== 'UNKNOWN') {
                    finalParent = mapped.parent;
                    finalSub = mapped.subcategory;
                }
            }

            if (p.parentCategory !== finalParent || p.subcategory !== finalSub || !p.source) {
                p.parentCategory = finalParent;
                p.subcategory = finalSub;
                if (!p.source) p.source = 'scraped';
                await p.save();
                updated++;
                if (updated % 50 === 0) console.log(`Updated ${updated} products...`);
            }
        }
        console.log(`Migration complete. Updated ${updated} products.`);
        return { message: `Migration complete. Updated ${updated} products.` };
    }

    async createManualProduct(data: any, clerkUserId: string) {
        const product = await this.productModel.create({
            ...data,
            clerkUserId,
            source: 'user',
            lastUpdated: new Date()
        });
        
        // Index in Elasticsearch
        try {
            await this.searchService.indexProduct(product);
        } catch (error) {
            console.error('Failed to index manual product:', error);
        }
        
        return product;
    }

    async findUserProducts(clerkUserId: string) {
        return this.productModel
            .find({ clerkUserId, source: 'user' })
            .sort({ lastUpdated: -1 })
            .exec();
    }

    async deleteManualProduct(id: string, clerkUserId: string) {
        const product = await this.productModel.findOne({ _id: id, clerkUserId, source: 'user' });
        if (!product) {
            throw new Error('Product not found or unauthorized');
        }

        // Remove from DB
        await this.productModel.deleteOne({ _id: id });

        // Remove from Elasticsearch
        try {
            await this.searchService.deleteProduct(id);
        } catch (error) {
            console.error('Failed to remove product from index:', error);
        }

        return { success: true };
    }

    async findById(id: string) {
        return this.productModel.findById(id).exec();
    }

    async getStores(): Promise<string[]> {
        return this.productModel.distinct('store').exec();
    }

    async getCategories(): Promise<string[]> {
        return this.productModel.distinct('category').exec();
    }

    getTaxonomy(): Record<string, string[]> {
        return TAXONOMY;
    }

    getSubcategories(parent: string): string[] {
        return TAXONOMY[parent] ?? [];
    }
}
