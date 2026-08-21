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

    return this.withMenuItemNames((data ?? []) as Record<string, any>[]);
  }

  // order_items only stores menu_item_id (+ the price frozen at order time),
  // so the dish name has to be resolved separately or the UI shows a
  // placeholder like "1 x Item" instead of the actual name.
  private async withMenuItemNames(
    items: Record<string, any>[],
  ): Promise<Record<string, any>[]> {
    if (items.length === 0) {
      return items;
    }

    const menuItemIds = [
      ...new Set(items.map((item) => item.menu_item_id).filter(Boolean)),
    ];

    const { data: menuItems, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .select('id, name')
      .in('id', menuItemIds);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const nameById = new Map(
      (menuItems ?? []).map((menuItem) => [menuItem.id, menuItem.name]),
    );

    return items.map((item) => ({
      ...item,
      name: nameById.get(item.menu_item_id) ?? null,
    }));
  }
}
