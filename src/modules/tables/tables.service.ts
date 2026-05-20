import {
  BadRequestException,
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

  async resolveByQr(qrCode: string): Promise<unknown> {
    const { restaurantId, tableNumber } = this.parseTableQrCode(qrCode);

    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('number', tableNumber)
      .single();

    if (error || !data) {
      throw new NotFoundException('Table not found for this QR code');
    }

    return {
      ...(data as object),
      qr_payload: {
        restaurant_id: restaurantId,
        number: tableNumber,
      },
    };
  }

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

  async findOneForRestaurant(id: string, restaurantId: string): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('tables')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Table not found');
    }

    return data;
  }

  async create(createTableDto: CreateTableDto, restaurantIdOverride?: string): Promise<unknown> {
    const restaurantId = restaurantIdOverride;
    if (!restaurantId) {
      throw new InternalServerErrorException('Authenticated restaurant_id is required');
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

  private parseTableQrCode(qrCode: string): { restaurantId: string; tableNumber: number } {
    const parts = qrCode.split(':');
    if (parts.length !== 3 || parts[0] !== 'table') {
      throw new BadRequestException('Invalid QR code format');
    }

    const restaurantId = parts[1];
    const restaurantIdV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!restaurantIdV4Regex.test(restaurantId)) {
      throw new BadRequestException('Invalid restaurant_id in QR code');
    }

    const tableNumber = Number.parseInt(parts[2], 10);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      throw new BadRequestException('Invalid table number in QR code');
    }

    return { restaurantId, tableNumber };
  }
}
