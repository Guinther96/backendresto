import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByRestaurant(restaurantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async create(createMenuItemDto: CreateMenuItemDto, restaurantIdOverride?: string): Promise<unknown> {
    const restaurantId = restaurantIdOverride ?? createMenuItemDto.restaurant_id;
    if (!restaurantId) {
      throw new InternalServerErrorException('restaurant_id is required');
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .insert({
        ...createMenuItemDto,
        restaurant_id: restaurantId,
        is_available: createMenuItemDto.is_available ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to create menu item',
      );
    }

    return data;
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .update(updateMenuItemDto)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Menu item not found');
    }

    return data;
  }

  async updateForRestaurant(
    id: string,
    restaurantId: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .update(updateMenuItemDto)
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Menu item not found');
    }

    return data;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException('Menu item not found');
    }

    return { deleted: true };
  }

  async removeForRestaurant(
    id: string,
    restaurantId: string,
  ): Promise<{ deleted: boolean }> {
    const { error } = await this.supabaseService
      .getClient()
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurantId);

    if (error) {
      throw new NotFoundException('Menu item not found');
    }

    return { deleted: true };
  }
}
