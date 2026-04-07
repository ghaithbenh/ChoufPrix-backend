import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrackedItemDocument = TrackedItem & Document;

@Schema({ collection: 'tracked_items', timestamps: true })
export class TrackedItem {
    @Prop({ required: true, index: true })
    clerkUserId: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
    productId: Types.ObjectId;
}

export const TrackedItemSchema = SchemaFactory.createForClass(TrackedItem);

// Compound unique index: a user can only track a product once
TrackedItemSchema.index({ clerkUserId: 1, productId: 1 }, { unique: true });
