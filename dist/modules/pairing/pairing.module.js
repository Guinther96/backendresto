"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairingModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const pairing_controller_1 = require("./pairing.controller");
const pairing_service_1 = require("./pairing.service");
let PairingModule = class PairingModule {
};
exports.PairingModule = PairingModule;
exports.PairingModule = PairingModule = __decorate([
    (0, common_1.Module)({
        imports: [
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
        controllers: [pairing_controller_1.PairingController],
        providers: [pairing_service_1.PairingService],
    })
], PairingModule);
//# sourceMappingURL=pairing.module.js.map