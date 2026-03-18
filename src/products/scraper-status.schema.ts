import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScraperStatusDocument = ScraperStatus & Document;

@Schema({ collection: 'scraper_status' })
export class ScraperStatus {
    @Prop({ required: true, unique: true })
    store: string;

    @Prop({ default: Date.now })
    lastScrapeTime: Date;

    @Prop({ default: 0 })
    productCount: number;

    @Prop({ enum: ['success', 'running', 'failed'], default: 'success' })
    status: string;

    @Prop()
    message?: string;
}

export const ScraperStatusSchema = SchemaFactory.createForClass(ScraperStatus);
