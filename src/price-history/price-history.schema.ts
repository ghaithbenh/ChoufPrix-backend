import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PriceHistoryDocument = PriceHistory & Document;

@Schema({ collection: 'pricehistories' })
export class PriceHistory {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ required: true })
    price: number;

    @Prop({ default: Date.now })
    date: Date;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);
