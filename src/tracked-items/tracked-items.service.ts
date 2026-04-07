import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrackedItem, TrackedItemDocument } from './tracked-item.schema';

@Injectable()
export class TrackedItemsService {
    constructor(
        @InjectModel(TrackedItem.name)
        private trackedItemModel: Model<TrackedItemDocument>,
    ) {}

    async getTrackedItems(clerkUserId: string) {
        return this.trackedItemModel
            .find({ clerkUserId })
            .populate('productId')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getTrackedProductIds(clerkUserId: string): Promise<string[]> {
        const items = await this.trackedItemModel
            .find({ clerkUserId })
            .select('productId')
            .lean()
            .exec();
        return items.map((item) => item.productId.toString());
    }

    async trackItem(clerkUserId: string, productId: string) {
        const existing = await this.trackedItemModel.findOne({
            clerkUserId,
            productId: new Types.ObjectId(productId),
        });

        if (existing) {
            return existing;
        }

        return this.trackedItemModel.create({
            clerkUserId,
            productId: new Types.ObjectId(productId),
        });
    }

    async untrackItem(clerkUserId: string, productId: string) {
        return this.trackedItemModel.deleteOne({
            clerkUserId,
            productId: new Types.ObjectId(productId),
        });
    }
}
