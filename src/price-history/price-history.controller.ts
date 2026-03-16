import { Controller, Get, Param } from '@nestjs/common';
import { PriceHistoryService } from './price-history.service';

@Controller('price-history')
export class PriceHistoryController {
    constructor(private readonly priceHistoryService: PriceHistoryService) { }

    @Get(':productId')
    findByProduct(@Param('productId') productId: string) {
        return this.priceHistoryService.findByProduct(productId);
    }
}
