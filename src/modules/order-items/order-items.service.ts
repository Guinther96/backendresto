import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface CreateOrderItemInput {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
}

@Injectable()
export class OrderItemsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async bulkInsert(items: CreateOrderItemInput[]): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('order_items')
      .insert(items)
      .select('*');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findByOrder(orderId: string): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }
}
