import { ForbiddenException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';

@Injectable()
export class KitchenService {
  constructor(private readonly ordersService: OrdersService) {}

  findSnapshot(restaurantId: string): Promise<unknown[]> {
    return this.ordersService.findKitchenSnapshot(restaurantId);
  }

  async updateOrderStatus(
    restaurantId: string,
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<unknown> {
    return this.ordersService.updateStatusForRestaurant(
      orderId,
      restaurantId,
      updateOrderStatusDto,
    );
  }
}
