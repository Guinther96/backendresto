import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findKitchenSnapshot(restaurantId: string): Promise<unknown[]>;
    create(createOrderDto: CreateOrderDto): Promise<unknown>;
    findMineByRestaurant(user: RequestUser, paginationQuery: PaginationQueryDto): Promise<unknown[]>;
    findByRestaurant(restaurantId: string, paginationQuery: PaginationQueryDto): Promise<unknown>;
    findOne(id: string): Promise<unknown>;
    updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
}
