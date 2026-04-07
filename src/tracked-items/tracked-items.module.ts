import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TrackedItem, TrackedItemSchema } from './tracked-item.schema';
import { TrackedItemsService } from './tracked-items.service';
import { TrackedItemsController } from './tracked-items.controller';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: TrackedItem.name, schema: TrackedItemSchema },
        ]),
    ],
    controllers: [TrackedItemsController],
    providers: [TrackedItemsService],
    exports: [TrackedItemsService],
})
export class TrackedItemsModule {}
