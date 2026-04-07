import { Body, Controller, Get, Param, Post, Query, Delete, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ClerkAuthGuard } from '../tracked-items/clerk-auth.guard';
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

    @Get('categories')
    getCategories() {
        return this.productsService.getCategories();
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
        @Query('category') category?: string,
        @Query('parentCategory') parentCategory?: string,
        @Query('subcategory') subcategory?: string,
        @Query('source') source?: string,
    ) {
        return this.searchService.searchProducts(q, minPrice, maxPrice, category, parentCategory, subcategory, source);
    }

    @Get()
    findAll(@Query() query: QueryProductDto) {
        return this.productsService.findAll(query);
    }
    @Get('taxonomy')
    getTaxonomy() {
        return this.productsService.getTaxonomy();
    }

    @Get('categories/:parent')
    getSubcategories(@Param('parent') parent: string) {
        return this.productsService.getSubcategories(parent);
    }

    @Get('index-all')
    indexAll() {
        return this.productsService.indexAllProducts();
    }

    @Get('migrate-now')
    migrate() {
        return this.productsService.migrateDatabase();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findById(id);
    }

    @Post()
    @UseGuards(ClerkAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() body: any, @Req() req: any) {
        return this.productsService.createManualProduct(body, req.clerkUserId);
    }

    @Get('user/all')
    @UseGuards(ClerkAuthGuard)
    getUserProducts(@Req() req: any) {
        return this.productsService.findUserProducts(req.clerkUserId);
    }

    @Delete(':id')
    @UseGuards(ClerkAuthGuard)
    delete(@Param('id') id: string, @Req() req: any) {
        return this.productsService.deleteManualProduct(id, req.clerkUserId);
    }

}