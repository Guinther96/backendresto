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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let AuthService = class AuthService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async register(dto) {
        const supabase = this.supabaseService.getClient();
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
        });
        if (signUpError || !signUpData.user) {
            throw new common_1.BadRequestException(signUpError?.message ?? 'Registration failed');
        }
        const userId = signUpData.user.id;
        const { error: profileError } = await supabase.from('users').insert({
            id: userId,
            email: dto.email,
            role: 'owner',
        });
        if (profileError) {
            await supabase.auth.admin.deleteUser(userId);
            throw new common_1.InternalServerErrorException(profileError.message);
        }
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
            name: dto.name,
            owner_id: userId,
            phone: dto.phone,
            address: dto.address,
        })
            .select('*')
            .single();
        if (restaurantError || !restaurant) {
            throw new common_1.InternalServerErrorException(restaurantError?.message ?? 'Failed to create restaurant');
        }
        const { data: linkedProfile, error: linkedProfileError } = await supabase
            .from('users')
            .update({ restaurant_id: restaurant.id })
            .eq('id', userId)
            .select('id, restaurant_id')
            .single();
        if (linkedProfileError || !linkedProfile) {
            await supabase
                .from('restaurants')
                .delete()
                .eq('id', restaurant.id);
            await supabase.from('users').delete().eq('id', userId);
            await supabase.auth.admin.deleteUser(userId);
            throw new common_1.InternalServerErrorException(linkedProfileError?.message ?? 'Failed to link restaurant to user');
        }
        return {
            message: 'Registration successful',
            restaurantId: restaurant.id,
        };
    }
    async login(dto) {
        const supabase = this.supabaseService.getAnonClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (signInError || !signInData.session || !signInData.user) {
            throw new common_1.UnauthorizedException(signInError?.message ?? 'Invalid credentials');
        }
        const serviceClient = this.supabaseService.getClient();
        const { data: profile, error: profileError } = await serviceClient
            .from('users')
            .select('id, email, role, restaurant_id')
            .eq('id', signInData.user.id)
            .single();
        if (profileError || !profile) {
            throw new common_1.InternalServerErrorException(profileError?.message ?? 'Unable to load user profile');
        }
        const restaurantId = profile
            ?.restaurant_id;
        let restaurant = null;
        if (restaurantId) {
            const { data } = await serviceClient
                .from('restaurants')
                .select('*')
                .eq('id', restaurantId)
                .single();
            restaurant = data;
        }
        return {
            session: {
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
            },
            user: {
                id: signInData.user.id,
                email: signInData.user.email,
                role: profile?.role ?? 'owner',
                restaurant_id: restaurantId ?? null,
            },
            restaurant,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map