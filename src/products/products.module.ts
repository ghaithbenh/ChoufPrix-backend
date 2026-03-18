import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './product.schema';
import { ScraperStatus, ScraperStatusSchema } from './scraper-status.schema';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: ScraperStatus.name, schema: ScraperStatusSchema },
        ]),
        SearchModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
})
export class ProductsModule { }