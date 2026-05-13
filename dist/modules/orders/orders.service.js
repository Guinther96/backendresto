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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../database/supabase.service");
const order_status_enum_1 = require("./enums/order-status.enum");
const realtime_service_1 = require("../realtime/realtime.service");
const order_items_service_1 = require("../order-items/order-items.service");
const kds_orders_gateway_1 = require("../realtime/kds-orders.gateway");
let OrdersService = class OrdersService {
    supabaseService;
    orderItemsService;
    realtimeService;
    kdsOrdersGateway;
    constructor(supabaseService, orderItemsService, realtimeService, kdsOrdersGateway) {
        this.supabaseService = supabaseService;
        this.orderItemsService = orderItemsService;
        this.realtimeService = realtimeService;
        this.kdsOrdersGateway = kdsOrdersGateway;
    }
    async findKitchenSnapshot(restaurantId) {
        const { data: orders, error } = await this.supabaseService
            .getClient()
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: true });
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        const enrichedOrders = await Promise.all((orders ?? []).map(async (order) => ({
            ...order,
            items: await this.orderItemsService.findByOrder(order.id),
        })));
        return enrichedOrders;
    }
    async create(createOrderDto) {
        const supabase = this.supabaseService.getClient();
        const { data: table, error: tableError } = await supabase
            .from('tables')
            .select('id, restaurant_id')
            .eq('id', createOrderDto.table_id)
            .single();
        if (tableError || !table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const menuItemIds = createOrderDto.items.map((item) => item.menu_item_id);
        const { data: menuItems, error: menuError } = await supabase
            .from('menu_items')
            .select('id, restaurant_id, price, is_available')
            .in('id', menuItemIds);
        if (menuError) {
            throw new common_1.InternalServerErrorException(menuError.message);
        }
        const menuMap = new Map((menuItems ?? []).map((menuItem) => [menuItem.id, menuItem]));
        for (const item of createOrderDto.items) {
            const found = menuMap.get(item.menu_item_id);
            if (!found || found.restaurant_id !== table.restaurant_id) {
                throw new common_1.NotFoundException(`Menu item ${item.menu_item_id} not found for this restaurant`);
            }
            if (!found.is_available) {
                throw new common_1.InternalServerErrorException(`Menu item ${item.menu_item_id} is currently unavailable`);
            }
        }
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
            table_id: table.id,
            restaurant_id: table.restaurant_id,
            status: order_status_enum_1.OrderStatus.PENDING,
        })
            .select('*')
            .single();
        if (orderError || !order) {
            throw new common_1.InternalServerErrorException(orderError?.message ?? 'Failed to create order');
        }
        try {
            await this.orderItemsService.bulkInsert(createOrderDto.items.map((item) => ({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                price: menuMap.get(item.menu_item_id)?.price ?? 0,
            })));
        }
        catch (error) {
            await supabase.from('orders').delete().eq('id', order.id);
            throw error;
        }
        await this.realtimeService.notifyNewOrder({
            orderId: order.id,
            restaurantId: table.restaurant_id,
            tableId: table.id,
        });
        await this.kdsOrdersGateway.emitOrdersUpdated(table.restaurant_id);
        return this.findOne(order.id);
    }
    async findByRestaurant(restaurantId, paginationQuery) {
        const page = paginationQuery.page;
        const limit = paginationQuery.limit;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const { data, error, count } = await this.supabaseService
            .getClient()
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return {
            data: data ?? [],
            meta: {
                page,
                limit,
                total: count ?? 0,
            },
        };
    }
    async findByRestaurantList(restaurantId, paginationQuery) {
        const result = await this.findByRestaurant(restaurantId, paginationQuery);
        return result.data ?? [];
    }
    async findOne(id) {
        const { data: order, error } = await this.supabaseService
            .getClient()
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const items = await this.orderItemsService.findByOrder(id);
        return {
            ...order,
            items,
        };
    }
    async updateStatus(id, updateOrderStatusDto) {
        const { data: order, error } = await this.supabaseService
            .getClient()
            .from('orders')
            .update({ status: updateOrderStatusDto.status })
            .eq('id', id)
            .select('*')
            .single();
        if (error || !order) {
            throw new common_1.NotFoundException('Order not found');
        }
        await this.realtimeService.notifyOrderStatusUpdated({
            orderId: order.id,
            restaurantId: order.restaurant_id,
            status: order.status,
        });
        await this.kdsOrdersGateway.emitOrdersUpdated(order.restaurant_id);
        return this.findOne(order.id);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        order_items_service_1.OrderItemsService,
        realtime_service_1.RealtimeService,
        kds_orders_gateway_1.KdsOrdersGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map