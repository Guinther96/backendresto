import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async notifyNewOrder(payload: {
    orderId: string;
    restaurantId: string;
    tableId: string;
  }): Promise<void> {
    const channel = this.supabaseService
      .getClient()
      .channel(`kitchen:${payload.restaurantId}`);

    try {
      await channel.httpSend('order.created', payload);
    } catch (error) {
      this.logger.warn(
        `Realtime broadcast failed for order ${payload.orderId}: ${String(error)}`,
      );
    }
  }

  async notifyOrderStatusUpdated(payload: {
    orderId: string;
    restaurantId: string;
    status: string;
  }): Promise<void> {
    const channel = this.supabaseService
      .getClient()
      .channel(`kitchen:${payload.restaurantId}`);

    try {
      await channel.httpSend('order.status.updated', payload);
    } catch (error) {
      this.logger.warn(
        `Realtime status broadcast failed for order ${payload.orderId}: ${String(error)}`,
      );
    }
  }
}
