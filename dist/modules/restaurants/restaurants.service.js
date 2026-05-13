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
exports.RestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let RestaurantsService = class RestaurantsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.NotFoundException(error.message);
        }
        return data ?? [];
    }
    async findOne(id) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return data;
    }
    async findMine(restaurantId) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', restaurantId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId);
        return {
            ...data,
            order_summary: { total: count ?? 0 },
        };
    }
    async update(restaurantId, dto) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('restaurants')
            .update(dto)
            .eq('id', restaurantId)
            .select('*')
            .single();
        if (error || !data) {
            throw new common_1.InternalServerErrorException(error?.message ?? 'Failed to update restaurant');
        }
        return this.findMine(restaurantId);
    }
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map