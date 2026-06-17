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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let JwtAuthGuard = class JwtAuthGuard {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Missing authorization token');
        }
        const serviceClient = this.supabaseService.getServiceClient();
        const { data: { user }, error, } = await serviceClient.auth.getUser(token);
        if (error || !user) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        const { data: profile, error: profileError } = await serviceClient
            .from('users')
            .select('role, restaurant_id')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            throw new common_1.UnauthorizedException('Unable to load user profile');
        }
        const requestUser = {
            id: user.id,
            email: user.email ?? '',
            role: profile?.role ?? 'owner',
            restaurantId: profile?.restaurant_id ?? null,
        };
        request.user = requestUser;
        return true;
    }
    extractToken(request) {
        const headers = request.headers;
        const rawAuthorization = headers?.authorization;
        const authorization = Array.isArray(rawAuthorization)
            ? rawAuthorization[0]
            : rawAuthorization;
        if (typeof authorization !== 'string')
            return null;
        const [scheme, token] = authorization.trim().split(/\s+/, 2);
        if (scheme?.toLowerCase() !== 'bearer' || !token)
            return null;
        return token;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map