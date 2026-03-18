import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { SearchService } from '../search/search.service';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly searchService: SearchService,
    ) { }

    @Get('stores')
    getStores() {
        return this.productsService.getStores();
    }

    @Get('stats')
    getStats() {
        return this.productsService.getStats();
    }

    @Post('scraper-status')
    updateScraperStatus(
        @Body() body: { store: string; status: string; count?: number; message?: string },
    ) {
        return this.productsService.updateScraperStatus(
            body.store,
            body.status,
            body.count,
            body.message,
        );
    }

    @Get('search')
    search(
        @Query('q') q: string,
        @Query('minPrice') minPrice?: number,
        @Query('maxPrice') maxPrice?: number,
    ) {
        return this.searchService.searchProducts(q, minPrice, maxPrice);
    }

    @Get()
    findAll(@Query() query: QueryProductDto) {
        return this.productsService.findAll(query);
    }
    @Get('index-all')
    indexAll() {
        return this.productsService.indexAllProducts();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findById(id);
    }

}