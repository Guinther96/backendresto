import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../../database/supabase.service';

@WebSocketGateway({
  namespace: 'orders',
  cors: { origin: '*' },
})
export class KdsOrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(KdsOrdersGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly supabaseService: SupabaseService) {}

  async handleConnection(client: Socket): Promise<void> {
    const restaurantId = this.extractRestaurantId(client.handshake.query);
    if (!restaurantId) {
      return;
    }

    client.join(this.roomName(restaurantId));
    await this.emitOrdersUpdated(restaurantId);
  }

  @SubscribeMessage('orders.join')
  async onOrdersJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { restaurantId?: string },
  ): Promise<void> {
    const restaurantId = payload?.restaurantId ?? this.extractRestaurantId(client.handshake.query);
    if (!restaurantId) {
      client.emit('orders.updated', { orders: [] });
      return;
    }

    client.join(this.roomName(restaurantId));
    await this.emitOrdersUpdated(restaurantId);
  }

  async emitOrdersUpdated(restaurantId: string): Promise<void> {
    try {
      const orders = await this.getKitchenSnapshot(restaurantId);
      this.server.to(this.roomName(restaurantId)).emit('orders.updated', { orders });
    } catch (error) {
      this.logger.warn(
        `Failed to emit orders.updated for restaurant ${restaurantId}: ${String(error)}`,
      );
    }
  }

  private async getKitchenSnapshot(restaurantId: string): Promise<unknown[]> {
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
      (orders ?? []).map(async (order) => {
        const { data: items, error: itemsError } = await this.supabaseService
          .getClient()
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          throw new InternalServerErrorException(itemsError.message);
        }

        return {
          ...order,
          items: items ?? [],
        };
      }),
    );

    return enrichedOrders;
  }

  private roomName(restaurantId: string): string {
    return `restaurant:${restaurantId}`;
  }

  private extractRestaurantId(query: Socket['handshake']['query']): string | null {
    const raw = query?.restaurantId;
    if (typeof raw === 'string' && raw.length > 0) {
      return raw;
    }
    if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0) {
      return raw[0];
    }
    return null;
  }
}
