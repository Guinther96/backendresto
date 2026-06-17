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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let TablesService = class TablesService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async resolveByQr(qrCode) {
        if (typeof qrCode !== 'string' || qrCode.trim().length === 0) {
            throw new common_1.BadRequestException('qrCode is required');
        }
        const normalizedQrCode = qrCode.trim();
        const tableByExactQr = await this.findByExactQrCode(normalizedQrCode);
        if (tableByExactQr) {
            return {
                ...tableByExactQr,
                qr_payload: {
                    restaurant_id: tableByExactQr.restaurant_id,
                    number: tableByExactQr.number,
                },
            };
        }
        const decodedPayload = this.extractQrPayloadFromUrl(normalizedQrCode);
        if (decodedPayload && decodedPayload !== normalizedQrCode) {
            const tableByDecodedQr = await this.findByExactQrCode(decodedPayload);
            if (tableByDecodedQr) {
                return {
                    ...tableByDecodedQr,
                    qr_payload: {
                        restaurant_id: tableByDecodedQr.restaurant_id,
                        number: tableByDecodedQr.number,
                    },
                };
            }
        }
        const { restaurantId, tableNumber } = this.parseTableQrCode(decodedPayload ?? normalizedQrCode);
        const { data, error } = await this.supabaseService
            .getAnonClient()
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('number', tableNumber)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Table not found for this QR code');
        }
        return {
            ...data,
            qr_payload: {
                restaurant_id: restaurantId,
                number: tableNumber,
            },
        };
    }
    async findByRestaurant(restaurantId) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('number', { ascending: true });
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        const rows = (data ?? []);
        return rows.map((r) => this.normalizeTableRow(r));
    }
    async findOne(id) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('tables')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Table not found');
        }
        return this.normalizeTableRow(data);
    }
    async findOneForRestaurant(id, restaurantId) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('tables')
            .select('*')
            .eq('id', id)
            .eq('restaurant_id', restaurantId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Table not found');
        }
        return this.normalizeTableRow(data);
    }
    async create(createTableDto, restaurantIdOverride) {
        const restaurantId = restaurantIdOverride;
        if (!restaurantId) {
            throw new common_1.InternalServerErrorException('Authenticated restaurant_id is required');
        }
        const frontendUrl = (process.env.FRONTEND_URL ?? 'https://orderclient.netlify.app').replace(/\/$/, '');
        const qrCode = `${frontendUrl}/?restaurant_id=${restaurantId}&table=${createTableDto.number}`;
        const { data, error } = await this.supabaseService
            .getAnonClient()
            .from('tables')
            .insert({
            restaurant_id: restaurantId,
            number: createTableDto.number,
            qr_code: qrCode,
            ...(createTableDto.capacity !== undefined
                ? { capacity: createTableDto.capacity }
                : {}),
        })
            .select('*')
            .single();
        if (error?.code === '23505') {
            throw new common_1.ConflictException('A table with this number already exists for this restaurant');
        }
        if (error || !data) {
            throw new common_1.InternalServerErrorException(error?.message ?? 'Failed to create table');
        }
        return this.normalizeTableRow(data);
    }
    normalizeTableRow(row) {
        const frontendUrl = (process.env.FRONTEND_URL ?? 'https://orderclient.netlify.app').replace(/\/$/, '');
        const token = row.qr_token ?? row.qrToken ?? row.qr_code;
        if (typeof token === 'string' && token.trim().length > 0) {
            try {
                const url = new URL(token);
                if (url.searchParams.has('restaurant_id') || url.searchParams.has('restaurantId')) {
                    return { ...row, qr_code: token };
                }
                const menuMatch = url.pathname.match(/\/menu\/(?:@?)([^\/\?]+)/i);
                const tableParam = url.searchParams.get('table') ?? url.searchParams.get('number');
                if (menuMatch) {
                    const rid = menuMatch[1];
                    const table = tableParam ?? row.number ?? url.hash.replace(/^#/, '');
                    if (rid) {
                        const built = `${frontendUrl}/?restaurant_id=${encodeURIComponent(rid)}${table ? `&table=${encodeURIComponent(String(table))}` : ''}`;
                        return { ...row, qr_code: built };
                    }
                }
                return { ...row, qr_code: token };
            }
            catch {
                return { ...row, qr_code: token };
            }
        }
        if (typeof row.qr_code === 'string' && row.qr_code.startsWith('table:')) {
            try {
                const parts = row.qr_code.split(':');
                const rid = parts[1];
                const table = parts[2];
                if (rid && table) {
                    const built = `${frontendUrl}/?restaurant_id=${encodeURIComponent(rid)}&table=${encodeURIComponent(table)}`;
                    return { ...row, qr_code: built };
                }
            }
            catch {
            }
        }
        return row;
    }
    parseTableQrCode(qrCode) {
        const parts = qrCode.split(':');
        if (parts.length !== 3 || parts[0] !== 'table') {
            throw new common_1.BadRequestException('Invalid QR code format');
        }
        const restaurantId = parts[1];
        const restaurantIdV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!restaurantIdV4Regex.test(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurant_id in QR code');
        }
        const tableNumber = Number.parseInt(parts[2], 10);
        if (!Number.isInteger(tableNumber) || tableNumber < 1) {
            throw new common_1.BadRequestException('Invalid table number in QR code');
        }
        return { restaurantId, tableNumber };
    }
    async findByExactQrCode(qrCode) {
        const { data, error } = await this.supabaseService
            .getAnonClient()
            .from('tables')
            .select('*')
            .eq('qr_code', qrCode)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return (data ?? null);
    }
    extractQrPayloadFromUrl(qrValue) {
        try {
            const url = new URL(qrValue);
            const queryCandidates = [
                url.searchParams.get('qr'),
                url.searchParams.get('qrCode'),
                url.searchParams.get('qrcode'),
                url.searchParams.get('code'),
            ];
            for (const candidate of queryCandidates) {
                if (candidate && candidate.trim().length > 0) {
                    return candidate.trim();
                }
            }
            const pathCandidates = [
                decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? ''),
                decodeURIComponent(url.hash.replace(/^#/, '')),
            ];
            for (const candidate of pathCandidates) {
                if (candidate && candidate.startsWith('table:')) {
                    return candidate;
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TablesService);
//# sourceMappingURL=tables.service.js.map