import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
export interface RequestUser {
    id: string;
    email: string;
    role: string;
    restaurantId: string | null;
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractToken;
}
