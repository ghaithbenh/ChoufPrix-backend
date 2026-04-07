import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

@Controller('users')
@UseGuards(AdminGuard)
export class UsersController {
    private secretKey: string;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY') || '';
    }

    @Get()
    async listUsers() {
        const { createClerkClient } = await import('@clerk/clerk-sdk-node');
        const clerk = createClerkClient({ secretKey: this.secretKey });
        const users = await clerk.users.getUserList({
            limit: 100,
        });

        // Some SDK versions return { data: User[] }, others return User[]
        const userList = Array.isArray(users) ? users : (users as any).data;

        return userList.map(u => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.emailAddresses[0]?.emailAddress,
            role: (u.publicMetadata as any)?.role || 'user',
            assignedStore: (u.publicMetadata as any)?.assignedStore || null,
        }));
    }

    @Patch(':id/role')
    async updateRole(
        @Param('id') id: string,
        @Body() body: { role: string; assignedStore?: string },
    ) {
        const { createClerkClient } = await import('@clerk/clerk-sdk-node');
        const clerk = createClerkClient({ secretKey: this.secretKey });

        await clerk.users.updateUserMetadata(id, {
            publicMetadata: {
                role: body.role,
                assignedStore: body.role === 'sub-admin' ? body.assignedStore : null,
            },
        });

        return { success: true };
    }

    @Post()
    async createUser(@Body() body: any) {
        const { createClerkClient } = await import('@clerk/clerk-sdk-node');
        const clerk = createClerkClient({ secretKey: this.secretKey });

        const user = await clerk.users.createUser({
            firstName: body.firstName,
            lastName: body.lastName,
            emailAddress: [body.email],
            password: body.password,
            publicMetadata: {
                role: body.role || 'user',
                assignedStore: body.assignedStore || null,
            },
        });

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddresses[0]?.emailAddress,
            role: (user.publicMetadata as any)?.role || 'user',
        };
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        const { createClerkClient } = await import('@clerk/clerk-sdk-node');
        const clerk = createClerkClient({ secretKey: this.secretKey });

        await clerk.users.deleteUser(id);
        return { success: true };
    }
}
