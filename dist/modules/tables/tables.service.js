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
        return data ?? [];
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
        return data;
    }
    async create(createTableDto, restaurantIdOverride) {
        const restaurantId = restaurantIdOverride ?? createTableDto.restaurant_id;
        if (!restaurantId) {
            throw new common_1.InternalServerErrorException('restaurant_id is required');
        }
        const qrCode = `table:${restaurantId}:${createTableDto.number}`;
        const { data, error } = await this.supabaseService
            .getClient()
            .from('tables')
            .insert({
            restaurant_id: restaurantId,
            number: createTableDto.number,
            qr_code: qrCode,
            ...(createTableDto.capacity !== undefined ? { capacity: createTableDto.capacity } : {}),
        })
            .select('*')
            .single();
        if (error?.code === '23505') {
            throw new common_1.ConflictException('A table with this number already exists for this restaurant');
        }
        if (error || !data) {
            throw new common_1.InternalServerErrorException(error?.message ?? 'Failed to create table');
        }
        return data;
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TablesService);
//# sourceMappingURL=tables.service.js.map