import { OrdersService } from '../orders/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
export declare class KitchenService {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findSnapshot(restaurantId: string): Promise<unknown[]>;
    updateOrderStatus(restaurantId: string, orderId: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
}
