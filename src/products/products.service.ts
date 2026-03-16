import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async findAll(query: QueryProductDto) {
        const {
            store,
            search,
            minPrice,
            maxPrice,
            page = 1,
            limit = 20,
        } = query;

        const filter: Record<string, any> = {};

        if (store) {
            filter.store = store;
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

    async findById(id: string) {
        return this.productModel.findById(id).exec();
    }

    async getStores(): Promise<string[]> {
        return this.productModel.distinct('store').exec();
    }
}
