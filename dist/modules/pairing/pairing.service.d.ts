import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../database/supabase.service';
export declare class PairingService {
    private readonly supabaseService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(supabaseService: SupabaseService, jwtService: JwtService, configService: ConfigService);
    generateCode(restaurantId: string): Promise<{
        code: string;
        expiresAt: string;
    }>;
    connect(code: string): Promise<{
        restaurantId: string;
        token: string;
    }>;
    invalidateRestaurantCodes(restaurantId: string): Promise<{
        invalidated: number;
        restaurantId: string;
    }>;
    private assertRestaurantExists;
    private generateRandomCode;
}
