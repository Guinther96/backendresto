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
var KdsJwtGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KdsJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let KdsJwtGuard = KdsJwtGuard_1 = class KdsJwtGuard {
    jwtService;
    logger = new common_1.Logger(KdsJwtGuard_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const token = this.extractToken(request);
        const path = this.getRequestPath(request);
        const method = this.getRequestMethod(request);
        if (!token) {
            this.logger.warn(`Denied ${method} ${path}: missing Authorization bearer token`);
            throw new common_1.UnauthorizedException('Missing authorization token');
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            this.logger.warn(`Denied ${method} ${path}: invalid or expired KDS token`);
            throw new common_1.UnauthorizedException('Invalid or expired KDS token');
        }
        if (payload.scope !== 'kds') {
            this.logger.warn(`Denied ${method} ${path}: invalid token scope ${String(payload.scope)}`);
            throw new common_1.UnauthorizedException('Invalid token scope');
        }
        const restaurantId = payload.restaurantId ?? payload.sub;
        if (!restaurantId) {
            this.logger.warn(`Denied ${method} ${path}: token payload missing restaurant id`);
            throw new common_1.UnauthorizedException('Invalid KDS token payload');
        }
        const requestUser = {
            id: restaurantId,
            email: '',
            role: 'kds',
            restaurantId,
        };
        request.user = requestUser;
        this.logger.log(`Authorized ${method} ${path} for restaurant ${restaurantId}`);
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
    getRequestPath(request) {
        const value = request.originalUrl ?? request.url;
        return typeof value === 'string' ? value : 'unknown-path';
    }
    getRequestMethod(request) {
        const value = request.method;
        return typeof value === 'string' ? value : 'UNKNOWN';
    }
};
exports.KdsJwtGuard = KdsJwtGuard;
exports.KdsJwtGuard = KdsJwtGuard = KdsJwtGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], KdsJwtGuard);
//# sourceMappingURL=kds-jwt.guard.js.map