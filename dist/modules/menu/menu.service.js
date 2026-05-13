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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let MenuService = class MenuService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findByRestaurant(restaurantId) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data ?? [];
    }
    async create(createMenuItemDto, restaurantIdOverride) {
        const restaurantId = restaurantIdOverride ?? createMenuItemDto.restaurant_id;
        if (!restaurantId) {
            throw new common_1.InternalServerErrorException('restaurant_id is required');
        }
        const { data, error } = await this.supabaseService
            .getClient()
            .from('menu_items')
            .insert({
            ...createMenuItemDto,
            restaurant_id: restaurantId,
            is_available: createMenuItemDto.is_available ?? true,
        })
            .select('*')
            .single();
        if (error || !data) {
            throw new common_1.InternalServerErrorException(error?.message ?? 'Failed to create menu item');
        }
        return data;
    }
    async update(id, updateMenuItemDto) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('menu_items')
            .update(updateMenuItemDto)
            .eq('id', id)
            .select('*')
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        return data;
    }
    async remove(id) {
        const { error } = await this.supabaseService
            .getClient()
            .from('menu_items')
            .delete()
            .eq('id', id);
        if (error) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        return { deleted: true };
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], MenuService);
//# sourceMappingURL=menu.service.js.map