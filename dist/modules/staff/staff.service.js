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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let StaffService = class StaffService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getStaff(restaurantId) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('users')
            .select('id, email, role, restaurant_id')
            .eq('restaurant_id', restaurantId)
            .eq('role', 'staff');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async addStaff(restaurantId, dto) {
        const supabase = this.supabaseService.getClient();
        const { data: existing } = await supabase
            .from('users')
            .select('id, restaurant_id, role')
            .eq('email', dto.email)
            .single();
        if (!existing) {
            throw new common_1.NotFoundException('No user found with this email. They must register first.');
        }
        if (existing.restaurant_id) {
            throw new common_1.BadRequestException('This user is already part of a restaurant');
        }
        const { data, error } = await supabase
            .from('users')
            .update({ restaurant_id: restaurantId, role: 'staff' })
            .eq('id', existing.id)
            .select('id, email, role, restaurant_id')
            .single();
        if (error || !data) {
            throw new common_1.InternalServerErrorException(error?.message ?? 'Failed to add staff');
        }
        return data;
    }
    async removeStaff(restaurantId, staffUserId) {
        const supabase = this.supabaseService.getClient();
        const { data: user } = await supabase
            .from('users')
            .select('id, restaurant_id')
            .eq('id', staffUserId)
            .single();
        if (!user || user.restaurant_id !== restaurantId) {
            throw new common_1.ForbiddenException('Staff member not found in your restaurant');
        }
        const { error } = await supabase
            .from('users')
            .update({ restaurant_id: null, role: 'owner' })
            .eq('id', staffUserId);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], StaffService);
//# sourceMappingURL=staff.service.js.map