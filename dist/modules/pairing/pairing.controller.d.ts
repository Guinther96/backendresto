import { PairingService } from './pairing.service';
import { GeneratePairingCodeDto } from './dto/generate-pairing-code.dto';
import { ConnectPairingCodeDto } from './dto/connect-pairing-code.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class PairingController {
    private readonly pairingService;
    constructor(pairingService: PairingService);
    generate(user: RequestUser, dto: GeneratePairingCodeDto): Promise<{
        code: string;
        expiresAt: string;
    }>;
    connect(dto: ConnectPairingCodeDto): Promise<{
        restaurantId: string;
        token: string;
    }>;
    invalidateRestaurantCodes(user: RequestUser, restaurantId: string): Promise<{
        invalidated: number;
        restaurantId: string;
    }>;
}
