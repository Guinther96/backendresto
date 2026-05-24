"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const kitchen_controller_1 = require("./kitchen.controller");
const kitchen_service_1 = require("./kitchen.service");
const orders_module_1 = require("../orders/orders.module");
const kds_jwt_guard_1 = require("../../common/guards/kds-jwt.guard");
let KitchenModule = class KitchenModule {
};
exports.KitchenModule = KitchenModule;
exports.KitchenModule = KitchenModule = __decorate([
    (0, common_1.Module)({
        imports: [
            orders_module_1.OrdersModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const secret = configService.get('KDS_JWT_SECRET') ||
                        configService.get('JWT_SECRET');
                    if (!secret) {
                        throw new Error('KDS_JWT_SECRET or JWT_SECRET is required');
                    }
                    return { secret };
                },
            }),
        ],
        controllers: [kitchen_controller_1.KitchenController],
        providers: [kitchen_service_1.KitchenService, kds_jwt_guard_1.KdsJwtGuard],
    })
], KitchenModule);
//# sourceMappingURL=kitchen.module.js.map