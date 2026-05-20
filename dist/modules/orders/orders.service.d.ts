import { SupabaseService } from '../../database/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { OrderItemsService } from '../order-items/order-items.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { KdsOrdersGateway } from '../realtime/kds-orders.gateway';
export declare class OrdersService {
    private readonly supabaseService;
    private readonly orderItemsService;
    private readonly realtimeService;
    private readonly kdsOrdersGateway;
    constructor(supabaseService: SupabaseService, orderItemsService: OrderItemsService, realtimeService: RealtimeService, kdsOrdersGateway: KdsOrdersGateway);
    findKitchenSnapshot(restaurantId: string): Promise<unknown[]>;
    create(createOrderDto: CreateOrderDto): Promise<unknown>;
    findByRestaurant(restaurantId: string, paginationQuery: PaginationQueryDto): Promise<unknown>;
    findByRestaurantList(restaurantId: string, paginationQuery: PaginationQueryDto): Promise<unknown[]>;
    findOne(id: string): Promise<unknown>;
    findOneForRestaurant(id: string, restaurantId: string): Promise<unknown>;
    updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
    updateStatusForRestaurant(id: string, restaurantId: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
}
