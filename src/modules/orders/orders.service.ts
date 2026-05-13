import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';
import { RealtimeService } from '../realtime/realtime.service';
import { OrderItemsService } from '../order-items/order-items.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { KdsOrdersGateway } from '../realtime/kds-orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly orderItemsService: OrderItemsService,
    private readonly realtimeService: RealtimeService,
    private readonly kdsOrdersGateway: KdsOrdersGateway,
  ) {}

  async findKitchenSnapshot(restaurantId: string): Promise<unknown[]> {
    const { data: orders, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const enrichedOrders = await Promise.all(
      (orders ?? []).map(async (order) => ({
        ...order,
        items: await this.orderItemsService.findByOrder(order.id),
      })),
    );

    return enrichedOrders;
  }

  async create(createOrderDto: CreateOrderDto): Promise<unknown> {
    const supabase = this.supabaseService.getClient();

    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, restaurant_id')
      .eq('id', createOrderDto.table_id)
      .single();

    if (tableError || !table) {
      throw new NotFoundException('Table not found');
    }

    const menuItemIds = createOrderDto.items.map((item) => item.menu_item_id);

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, price, is_available')
      .in('id', menuItemIds);

    if (menuError) {
      throw new InternalServerErrorException(menuError.message);
    }

    const menuMap = new Map((menuItems ?? []).map((menuItem) => [menuItem.id, menuItem]));

    for (const item of createOrderDto.items) {
      const found = menuMap.get(item.menu_item_id);
      if (!found || found.restaurant_id !== table.restaurant_id) {
        throw new NotFoundException(
          `Menu item ${item.menu_item_id} not found for this restaurant`,
        );
      }
      if (!found.is_available) {
        throw new InternalServerErrorException(
          `Menu item ${item.menu_item_id} is currently unavailable`,
        );
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: table.id,
        restaurant_id: table.restaurant_id,
        status: OrderStatus.PENDING,
      })
      .select('*')
      .single();

    if (orderError || !order) {
      throw new InternalServerErrorException(
        orderError?.message ?? 'Failed to create order',
      );
    }

    try {
      await this.orderItemsService.bulkInsert(
        createOrderDto.items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: menuMap.get(item.menu_item_id)?.price ?? 0,
        })),
      );
    } catch (error) {
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

  async findByRestaurant(
    restaurantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<unknown> {
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
      throw new InternalServerErrorException(error.message);
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

  async findByRestaurantList(
    restaurantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<unknown[]> {
    const result = await this.findByRestaurant(restaurantId, paginationQuery) as {
      data?: unknown[];
    };

    return result.data ?? [];
  }

  async findOne(id: string): Promise<unknown> {
    const { data: order, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.orderItemsService.findByOrder(id);

    return {
      ...order,
      items,
    };
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<unknown> {
    const { data: order, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .update({ status: updateOrderStatusDto.status })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !order) {
      throw new NotFoundException('Order not found');
    }

    await this.realtimeService.notifyOrderStatusUpdated({
      orderId: order.id,
      restaurantId: order.restaurant_id,
      status: order.status,
    });
    await this.kdsOrdersGateway.emitOrdersUpdated(order.restaurant_id);

    return this.findOne(order.id);
  }
}
