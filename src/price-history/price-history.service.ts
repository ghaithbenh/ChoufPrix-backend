import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceHistory, PriceHistoryDocument } from './price-history.schema';

@Injectable()
export class PriceHistoryService {
    constructor(
        @InjectModel(PriceHistory.name)
        private priceHistoryModel: Model<PriceHistoryDocument>,
    ) { }

    async findByProduct(productId: string) {
        return this.priceHistoryModel
            .find({ productId })
            .sort({ date: 1 })
            .exec();
    }
}
