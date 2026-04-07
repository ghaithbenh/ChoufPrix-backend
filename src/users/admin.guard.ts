import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
    private secretKey: string;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY') || '';
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1];

        try {
            const { verifyToken, createClerkClient } = await import('@clerk/clerk-sdk-node');
            const payload = await verifyToken(token, {
                secretKey: this.secretKey,
                issuer: 'https://enough-civet-41.clerk.accounts.dev',
            });

            // Fetch full user to verify role
            const clerk = createClerkClient({ secretKey: this.secretKey });
            const user = await clerk.users.getUser(payload.sub);

            const role = (user.publicMetadata as any)?.role;

            if (role !== 'admin') {
                throw new ForbiddenException('Access denied: Admin only');
            }

            request['clerkUserId'] = payload.sub;
            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) throw error;
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
