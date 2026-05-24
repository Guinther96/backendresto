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
var KdsOrdersGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KdsOrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const supabase_service_1 = require("../../database/supabase.service");
let KdsOrdersGateway = KdsOrdersGateway_1 = class KdsOrdersGateway {
    supabaseService;
    logger = new common_1.Logger(KdsOrdersGateway_1.name);
    server;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async handleConnection(client) {
        const restaurantId = this.extractRestaurantId(client.handshake.query);
        if (!restaurantId) {
            return;
        }
        client.join(this.roomName(restaurantId));
        await this.emitOrdersUpdated(restaurantId);
    }
    async onOrdersJoin(client, payload) {
        const restaurantId = payload?.restaurantId ?? this.extractRestaurantId(client.handshake.query);
        if (!restaurantId) {
            client.emit('orders.updated', { orders: [] });
            return;
        }
        client.join(this.roomName(restaurantId));
        await this.emitOrdersUpdated(restaurantId);
    }
    async emitOrdersUpdated(restaurantId) {
        try {
            const orders = await this.getKitchenSnapshot(restaurantId);
            this.server
                .to(this.roomName(restaurantId))
                .emit('orders.updated', { orders });
        }
        catch (error) {
            this.logger.warn(`Failed to emit orders.updated for restaurant ${restaurantId}: ${String(error)}`);
        }
    }
    async getKitchenSnapshot(restaurantId) {
        const { data: orders, error } = await this.supabaseService
            .getClient()
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: true });
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        const enrichedOrders = await Promise.all((orders ?? []).map(async (order) => {
            const { data: items, error: itemsError } = await this.supabaseService
                .getClient()
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);
            if (itemsError) {
                throw new common_1.InternalServerErrorException(itemsError.message);
            }
            return {
                ...order,
                items: items ?? [],
            };
        }));
        return enrichedOrders;
    }
    roomName(restaurantId) {
        return `restaurant:${restaurantId}`;
    }
    extractRestaurantId(query) {
        const raw = query?.restaurantId;
        if (typeof raw === 'string' && raw.length > 0) {
            return raw;
        }
        if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0) {
            return raw[0];
        }
        return null;
    }
};
exports.KdsOrdersGateway = KdsOrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], KdsOrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('orders.join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], KdsOrdersGateway.prototype, "onOrdersJoin", null);
exports.KdsOrdersGateway = KdsOrdersGateway = KdsOrdersGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'orders',
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], KdsOrdersGateway);
//# sourceMappingURL=kds-orders.gateway.js.map