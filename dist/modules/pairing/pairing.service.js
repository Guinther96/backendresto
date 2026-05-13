"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PairingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairingService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../../database/supabase.service");
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_GENERATION_RETRIES = 8;
let PairingService = PairingService_1 = class PairingService {
    supabaseService;
    jwtService;
    configService;
    logger = new common_1.Logger(PairingService_1.name);
    constructor(supabaseService, jwtService, configService) {
        this.supabaseService = supabaseService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async generateCode(restaurantId) {
        const supabase = this.supabaseService.getClient();
        await this.assertRestaurantExists(restaurantId);
        await supabase
            .from('pairing_codes')
            .delete()
            .eq('restaurant_id', restaurantId);
        const expiresAt = new Date(Date.now() + CODE_TTL_MS);
        for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt += 1) {
            const code = this.generateRandomCode();
            const { data, error } = (await supabase
                .from('pairing_codes')
                .insert({
                code,
                restaurant_id: restaurantId,
                expires_at: expiresAt.toISOString(),
                used: false,
            })
                .select('code, expires_at')
                .single());
            if (!error && data) {
                return {
                    code: data.code,
                    expiresAt: data.expires_at,
                };
            }
            const message = error?.message ?? '';
            const isUniqueViolation = message.includes('duplicate key value') ||
                message.includes('pairing_codes_code_key');
            if (!isUniqueViolation) {
                throw new common_1.InternalServerErrorException(message || 'Failed to create pairing code');
            }
        }
        throw new common_1.InternalServerErrorException('Could not generate a unique pairing code');
    }
    async connect(code) {
        const normalizedCode = code.trim().toUpperCase();
        const supabase = this.supabaseService.getClient();
        const { data: pairingRow, error } = (await supabase
            .from('pairing_codes')
            .select('id, code, restaurant_id, expires_at, used')
            .eq('code', normalizedCode)
            .single());
        if (error || !pairingRow) {
            this.logger.warn(`Invalid pairing attempt with code ${normalizedCode}`);
            throw new common_1.UnauthorizedException('Invalid pairing code');
        }
        const row = pairingRow;
        if (row.used) {
            this.logger.warn(`Already used pairing code ${normalizedCode}`);
            throw new common_1.UnauthorizedException('Pairing code already used');
        }
        const expiresAt = new Date(row.expires_at);
        if (Number.isNaN(expiresAt.getTime()) ||
            expiresAt.getTime() <= Date.now()) {
            this.logger.warn(`Expired pairing code ${normalizedCode}`);
            throw new common_1.UnauthorizedException('Pairing code expired');
        }
        const { data: usedRow, error: updateError } = (await supabase
            .from('pairing_codes')
            .update({ used: true })
            .eq('id', row.id)
            .eq('used', false)
            .select('restaurant_id')
            .single());
        if (updateError || !usedRow) {
            const { data: currentRow, error: currentError } = (await supabase
                .from('pairing_codes')
                .select('used')
                .eq('id', row.id)
                .single());
            if (!currentError && currentRow?.used) {
                throw new common_1.UnauthorizedException('Pairing code already used');
            }
            throw new common_1.UnauthorizedException('Pairing code is no longer valid');
        }
        const restaurantId = usedRow.restaurant_id;
        const expiresInRaw = this.configService.get('KDS_JWT_EXPIRES_IN') ?? '12h';
        const expiresIn = /^\d+$/.test(expiresInRaw)
            ? Number(expiresInRaw)
            : expiresInRaw;
        const token = await this.jwtService.signAsync({
            sub: restaurantId,
            restaurantId,
            scope: 'kds',
        }, { expiresIn });
        return {
            restaurantId,
            token,
        };
    }
    async invalidateRestaurantCodes(restaurantId) {
        const { error, count } = await this.supabaseService
            .getClient()
            .from('pairing_codes')
            .delete({ count: 'exact' })
            .eq('restaurant_id', restaurantId);
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return {
            invalidated: count ?? 0,
            restaurantId,
        };
    }
    async assertRestaurantExists(restaurantId) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('restaurants')
            .select('id')
            .eq('id', restaurantId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
    }
    generateRandomCode() {
        let code = '';
        for (let i = 0; i < CODE_LENGTH; i += 1) {
            const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
            code += CODE_CHARS[randomIndex];
        }
        return code;
    }
};
exports.PairingService = PairingService;
exports.PairingService = PairingService = PairingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jwt_1.JwtService,
        config_1.ConfigService])
], PairingService);
//# sourceMappingURL=pairing.service.js.map