import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
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
            // Use Clerk's SDK to verify the session token
            const { verifyToken } = await import('@clerk/clerk-sdk-node');
            const payload = await verifyToken(token, {
                secretKey: this.secretKey,
                issuer: 'https://enough-civet-41.clerk.accounts.dev',
            });

            // Attach the Clerk user ID to the request for downstream use
            request['clerkUserId'] = payload.sub;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
