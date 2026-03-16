import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceHistoryController } from './price-history.controller';
import { PriceHistoryService } from './price-history.service';
import { PriceHistory, PriceHistorySchema } from './price-history.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PriceHistory.name, schema: PriceHistorySchema },
        ]),
    ],
    controllers: [PriceHistoryController],
    providers: [PriceHistoryService],
})
export class PriceHistoryModule { }
