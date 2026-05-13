import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByRestaurant(restaurantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('number', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: string): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Table not found');
    }

    return data;
  }

  async create(createTableDto: CreateTableDto, restaurantIdOverride?: string): Promise<unknown> {
    const restaurantId = restaurantIdOverride ?? createTableDto.restaurant_id;
    if (!restaurantId) {
      throw new InternalServerErrorException('restaurant_id is required');
    }
    const qrCode = `table:${restaurantId}:${createTableDto.number}`;

    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        number: createTableDto.number,
        qr_code: qrCode,
        ...(createTableDto.capacity !== undefined ? { capacity: createTableDto.capacity } : {}),
      })
      .select('*')
      .single();

    if (error?.code === '23505') {
      throw new ConflictException(
        'A table with this number already exists for this restaurant',
      );
    }

    if (error || !data) {
      throw new InternalServerErrorException(error?.message ?? 'Failed to create table');
    }

    return data;
  }
}
