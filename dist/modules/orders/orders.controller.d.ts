import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findKitchenSnapshot(user: RequestUser): Promise<unknown[]>;
    create(createOrderDto: CreateOrderDto): Promise<unknown>;
    findMineByRestaurant(user: RequestUser, paginationQuery: PaginationQueryDto): Promise<unknown[]>;
    findByRestaurant(user: RequestUser, restaurantId: string, paginationQuery: PaginationQueryDto): Promise<unknown>;
    findOne(user: RequestUser, id: string): Promise<unknown>;
    updateStatus(user: RequestUser, id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
}
