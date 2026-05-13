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
    const order = (await this.ordersService.findOne(orderId)) as {
      restaurant_id?: string;
    };

    if (order.restaurant_id !== restaurantId) {
      throw new ForbiddenException('Order does not belong to your restaurant');
    }

    return this.ordersService.updateStatus(orderId, updateOrderStatusDto);
  }
}
