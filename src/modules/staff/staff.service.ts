import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AddStaffDto } from './dto/add-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getStaff(restaurantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, email, role, restaurant_id')
      .eq('restaurant_id', restaurantId)
      .eq('role', 'staff');

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async addStaff(restaurantId: string, dto: AddStaffDto): Promise<unknown> {
    const supabase = this.supabaseService.getClient();

    const { data: existing } = await supabase
      .from('users')
      .select('id, restaurant_id, role')
      .eq('email', dto.email)
      .single();

    if (!existing) {
      throw new NotFoundException(
        'No user found with this email. They must register first.',
      );
    }

    if ((existing as { restaurant_id?: string }).restaurant_id) {
      throw new BadRequestException('This user is already part of a restaurant');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ restaurant_id: restaurantId, role: 'staff' })
      .eq('id', (existing as { id: string }).id)
      .select('id, email, role, restaurant_id')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(error?.message ?? 'Failed to add staff');
    }

    return data;
  }

  async removeStaff(restaurantId: string, staffUserId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, restaurant_id')
      .eq('id', staffUserId)
      .single();

    if (!user || (user as { restaurant_id?: string }).restaurant_id !== restaurantId) {
      throw new ForbiddenException('Staff member not found in your restaurant');
    }

    const { error } = await supabase
      .from('users')
      .update({ restaurant_id: null, role: 'owner' })
      .eq('id', staffUserId);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
