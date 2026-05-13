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
exports.KitchenController = void 0;
const common_1 = require("@nestjs/common");
const kitchen_service_1 = require("./kitchen.service");
const kds_jwt_guard_1 = require("../../common/guards/kds-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const update_order_status_dto_1 = require("../orders/dto/update-order-status.dto");
let KitchenController = class KitchenController {
    kitchenService;
    constructor(kitchenService) {
        this.kitchenService = kitchenService;
    }
    findMyKitchenSnapshot(user) {
        if (!user.restaurantId)
            throw new common_1.ForbiddenException('No restaurant linked');
        return this.kitchenService.findSnapshot(user.restaurantId);
    }
    updateOrderStatus(user, id, updateOrderStatusDto) {
        if (!user.restaurantId)
            throw new common_1.ForbiddenException('No restaurant linked');
        return this.kitchenService.updateOrderStatus(user.restaurantId, id, updateOrderStatusDto);
    }
};
exports.KitchenController = KitchenController;
__decorate([
    (0, common_1.Get)('orders/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "findMyKitchenSnapshot", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new common_1.ParseUUIDPipe({ version: '4' }))),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "updateOrderStatus", null);
exports.KitchenController = KitchenController = __decorate([
    (0, common_1.Controller)('kitchen'),
    (0, common_1.UseGuards)(kds_jwt_guard_1.KdsJwtGuard),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], KitchenController);
//# sourceMappingURL=kitchen.controller.js.map