import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: string): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Restaurant not found');
    }

    return data;
  }

  async findMine(restaurantId: string): Promise<unknown> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Restaurant not found');
    }

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    return {
      ...(data as object),
      order_summary: { total: count ?? 0 },
    };
  }

  async update(
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('restaurants')
      .update(dto)
      .eq('id', restaurantId)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to update restaurant',
      );
    }

    return this.findMine(restaurantId);
  }
}
