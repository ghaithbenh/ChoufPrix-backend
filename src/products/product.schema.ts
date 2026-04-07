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

    @Prop({ default: 'Other' })
    category: string;

    @Prop({ default: 'Électroménager & Autres' })
    parentCategory: string;

    @Prop({ default: 'Divers' })
    subcategory: string;

    @Prop({ index: true })
    clerkUserId: string;

    @Prop({ default: 'scraped', index: true })
    source: string;

    @Prop({ default: Date.now })
    lastUpdated: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
