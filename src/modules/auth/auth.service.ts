import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(dto: RegisterDto): Promise<unknown> {
    const supabase = this.supabaseService.getClient();

    const { data: signUpData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (signUpError || !signUpData.user) {
      throw new BadRequestException(
        signUpError?.message ?? 'Registration failed',
      );
    }

    const userId = signUpData.user.id;

    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      email: dto.email,
      role: 'owner',
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw new InternalServerErrorException(profileError.message);
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: dto.name,
        owner_id: userId,
        phone: dto.phone,
        address: dto.address,
      })
      .select('*')
      .single();

    if (restaurantError || !restaurant) {
      throw new InternalServerErrorException(
        restaurantError?.message ?? 'Failed to create restaurant',
      );
    }

    const { data: linkedProfile, error: linkedProfileError } = await supabase
      .from('users')
      .update({ restaurant_id: (restaurant as { id: string }).id })
      .eq('id', userId)
      .select('id, restaurant_id')
      .single();

    if (linkedProfileError || !linkedProfile) {
      await supabase
        .from('restaurants')
        .delete()
        .eq('id', (restaurant as { id: string }).id);
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      throw new InternalServerErrorException(
        linkedProfileError?.message ?? 'Failed to link restaurant to user',
      );
    }

    return {
      message: 'Registration successful',
      restaurantId: (restaurant as { id: string }).id,
    };
  }

  async login(dto: LoginDto): Promise<unknown> {
    const supabase = this.supabaseService.getAnonClient();

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (signInError || !signInData.session || !signInData.user) {
      throw new UnauthorizedException(
        signInError?.message ?? 'Invalid credentials',
      );
    }

    const serviceClient = this.supabaseService.getClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('id, email, role, restaurant_id')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profile) {
      throw new InternalServerErrorException(
        profileError?.message ?? 'Unable to load user profile',
      );
    }

    const restaurantId = (profile as { restaurant_id?: string } | null)
      ?.restaurant_id;

    let restaurant: unknown = null;
    if (restaurantId) {
      const { data } = await serviceClient
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      restaurant = data;
    }

    return {
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        role: (profile as { role?: string } | null)?.role ?? 'owner',
        restaurant_id: restaurantId ?? null,
      },
      restaurant,
    };
  }
}
