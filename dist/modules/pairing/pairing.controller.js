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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairingController = void 0;
const common_1 = require("@nestjs/common");
const pairing_service_1 = require("./pairing.service");
const generate_pairing_code_dto_1 = require("./dto/generate-pairing-code.dto");
const connect_pairing_code_dto_1 = require("./dto/connect-pairing-code.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let PairingController = class PairingController {
    pairingService;
    constructor(pairingService) {
        this.pairingService = pairingService;
    }
    generate(user, dto) {
        if (!user.restaurantId || user.restaurantId !== dto.restaurantId) {
            throw new common_1.ForbiddenException('You can only generate a code for your restaurant');
        }
        return this.pairingService.generateCode(dto.restaurantId);
    }
    connect(dto) {
        return this.pairingService.connect(dto.code);
    }
    invalidateRestaurantCodes(user, restaurantId) {
        if (!user.restaurantId || user.restaurantId !== restaurantId) {
            throw new common_1.ForbiddenException('You can only invalidate your restaurant codes');
        }
        return this.pairingService.invalidateRestaurantCodes(restaurantId);
    }
};
exports.PairingController = PairingController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_pairing_code_dto_1.GeneratePairingCodeDto]),
    __metadata("design:returntype", void 0)
], PairingController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connect_pairing_code_dto_1.ConnectPairingCodeDto]),
    __metadata("design:returntype", void 0)
], PairingController.prototype, "connect", null);
__decorate([
    (0, common_1.Delete)('restaurant/:restaurantId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('restaurantId', new common_1.ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PairingController.prototype, "invalidateRestaurantCodes", null);
exports.PairingController = PairingController = __decorate([
    (0, common_1.Controller)('pairing'),
    __metadata("design:paramtypes", [pairing_service_1.PairingService])
], PairingController);
//# sourceMappingURL=pairing.controller.js.map