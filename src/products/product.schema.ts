import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ collection: 'products' })
export class Product {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    store: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    url: string;

    @Prop()
    image: string;

    @Prop()
    description: string;

    @Prop()
    category: string;

    @Prop({ default: Date.now })
    lastUpdated: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
