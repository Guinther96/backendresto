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
var RealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
let RealtimeService = RealtimeService_1 = class RealtimeService {
    supabaseService;
    logger = new common_1.Logger(RealtimeService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async notifyNewOrder(payload) {
        const channel = this.supabaseService
            .getClient()
            .channel(`kitchen:${payload.restaurantId}`);
        try {
            await channel.httpSend('order.created', payload);
        }
        catch (error) {
            this.logger.warn(`Realtime broadcast failed for order ${payload.orderId}: ${String(error)}`);
        }
    }
    async notifyOrderStatusUpdated(payload) {
        const channel = this.supabaseService
            .getClient()
            .channel(`kitchen:${payload.restaurantId}`);
        try {
            await channel.httpSend('order.status.updated', payload);
        }
        catch (error) {
            this.logger.warn(`Realtime status broadcast failed for order ${payload.orderId}: ${String(error)}`);
        }
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = RealtimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map