import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './product.schema';
import { ScraperStatus, ScraperStatusDocument } from './scraper-status.schema';
import { QueryProductDto } from './dto/query-product.dto';
import { SearchService } from '../search/search.service';
import { EventsGateway } from '../events/events.gateway';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(ScraperStatus.name) private scraperStatusModel: Model<ScraperStatusDocument>,
        private readonly searchService: SearchService,
        private readonly eventsGateway: EventsGateway,
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
            minPrice,
            maxPrice,
            page = 1,
            limit = 20,
        } = query;

        const filter: Record<string, any> = {};

        if (store) {
            filter.store = store;
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

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

    async findById(id: string) {
        return this.productModel.findById(id).exec();
    }

    async getStores(): Promise<string[]> {
        return this.productModel.distinct('store').exec();
    }

}
