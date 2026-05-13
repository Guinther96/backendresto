import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RequestUser } from './jwt-auth.guard';

interface KdsTokenPayload {
  sub?: string;
  restaurantId?: string;
  scope?: string;
}

@Injectable()
export class KdsJwtGuard implements CanActivate {
  private readonly logger = new Logger(KdsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const token = this.extractToken(request);
    const path = this.getRequestPath(request);
    const method = this.getRequestMethod(request);

    if (!token) {
      this.logger.warn(
        `Denied ${method} ${path}: missing Authorization bearer token`,
      );
      throw new UnauthorizedException('Missing authorization token');
    }

    let payload: KdsTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<KdsTokenPayload>(token);
    } catch {
      this.logger.warn(
        `Denied ${method} ${path}: invalid or expired KDS token`,
      );
      throw new UnauthorizedException('Invalid or expired KDS token');
    }

    if (payload.scope !== 'kds') {
      this.logger.warn(
        `Denied ${method} ${path}: invalid token scope ${String(payload.scope)}`,
      );
      throw new UnauthorizedException('Invalid token scope');
    }

    const restaurantId = payload.restaurantId ?? payload.sub;
    if (!restaurantId) {
      this.logger.warn(
        `Denied ${method} ${path}: token payload missing restaurant id`,
      );
      throw new UnauthorizedException('Invalid KDS token payload');
    }

    const requestUser: RequestUser = {
      id: restaurantId,
      email: '',
      role: 'kds',
      restaurantId,
    };

    (request as Record<string, unknown>).user = requestUser;
    this.logger.log(
      `Authorized ${method} ${path} for restaurant ${restaurantId}`,
    );
    return true;
  }

  private extractToken(request: Record<string, unknown>): string | null {
    const headers = request.headers as Record<string, string | string[]> | undefined;
    const rawAuthorization = headers?.authorization;
    const authorization = Array.isArray(rawAuthorization)
      ? rawAuthorization[0]
      : rawAuthorization;

    if (typeof authorization !== 'string') return null;

    const [scheme, token] = authorization.trim().split(/\s+/, 2);
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    return token;
  }

  private getRequestPath(request: Record<string, unknown>): string {
    const value = request.originalUrl ?? request.url;
    return typeof value === 'string' ? value : 'unknown-path';
  }

  private getRequestMethod(request: Record<string, unknown>): string {
    const value = request.method;
    return typeof value === 'string' ? value : 'UNKNOWN';
  }
}
