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
exports.KitchenService = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../orders/orders.service");
let KitchenService = class KitchenService {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    findSnapshot(restaurantId) {
        return this.ordersService.findKitchenSnapshot(restaurantId);
    }
    async updateOrderStatus(restaurantId, orderId, updateOrderStatusDto) {
        const order = (await this.ordersService.findOne(orderId));
        if (order.restaurant_id !== restaurantId) {
            throw new common_1.ForbiddenException('Order does not belong to your restaurant');
        }
        return this.ordersService.updateStatus(orderId, updateOrderStatusDto);
    }
};
exports.KitchenService = KitchenService;
exports.KitchenService = KitchenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], KitchenService);
//# sourceMappingURL=kitchen.service.js.map