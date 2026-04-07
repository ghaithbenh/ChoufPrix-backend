import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TrackedItemsService } from './tracked-items.service';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Controller('tracked-items')
@UseGuards(ClerkAuthGuard)
export class TrackedItemsController {
    constructor(private readonly trackedItemsService: TrackedItemsService) {}

    @Get()
    async getTrackedItems(@Req() req: any) {
        const clerkUserId = req.clerkUserId;
        return this.trackedItemsService.getTrackedItems(clerkUserId);
    }

    @Get('ids')
    async getTrackedProductIds(@Req() req: any) {
        const clerkUserId = req.clerkUserId;
        return this.trackedItemsService.getTrackedProductIds(clerkUserId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async trackItem(@Req() req: any, @Body('productId') productId: string) {
        const clerkUserId = req.clerkUserId;
        return this.trackedItemsService.trackItem(clerkUserId, productId);
    }

    @Delete(':productId')
    @HttpCode(HttpStatus.OK)
    async untrackItem(@Req() req: any, @Param('productId') productId: string) {
        const clerkUserId = req.clerkUserId;
        return this.trackedItemsService.untrackItem(clerkUserId, productId);
    }
}
