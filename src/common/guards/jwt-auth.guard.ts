import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const serviceClient = this.supabaseService.getServiceClient();
    const {
      data: { user },
      error,
    } = await serviceClient.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Read the authenticated user's profile using the service role client.
    // The access token was already validated, so fetching this specific row by
    // id is safe and avoids returning null because of restrictive RLS on users.
    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Unable to load user profile');
    }

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email ?? '',
      role: (profile as { role?: string } | null)?.role ?? 'owner',
      restaurantId:
        (profile as { restaurant_id?: string } | null)?.restaurant_id ?? null,
    };

    request.user = requestUser;
    return true;
  }

  private extractToken(request: Record<string, unknown>): string | null {
    const headers = request.headers as
      | Record<string, string | string[]>
      | undefined;
    const rawAuthorization = headers?.authorization;
    const authorization = Array.isArray(rawAuthorization)
      ? rawAuthorization[0]
      : rawAuthorization;

    if (typeof authorization !== 'string') return null;

    const [scheme, token] = authorization.trim().split(/\s+/, 2);
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    return token;
  }
}
