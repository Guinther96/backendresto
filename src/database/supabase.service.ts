import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private serviceClient: SupabaseClient | null = null;
  private anonKey: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Compatibility shim: many services call `getClient()` to obtain a
   * server-side Supabase client. Keep that API while also exposing
   * `getServiceClient()` as an alias.
   */
  getClient(): SupabaseClient {
    if (this.serviceClient) return this.serviceClient;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new InternalServerErrorException(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
      );
    }

    this.serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    return this.serviceClient;
  }

  /**
   * Backwards-compatible alias.
   */
  getServiceClient(): SupabaseClient {
    return this.getClient();
  }

  /**
   * Creates a Supabase client using the anon/public key.
   * Use for one-off auth operations on the server to avoid shared session state.
   */
  getAnonClient(): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new InternalServerErrorException(
        'SUPABASE_URL and SUPABASE_ANON_KEY are required for anon clients.',
      );
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Creates a Supabase client scoped to an end-user using the anon/public key
   * and the provided access token. This allows RLS policies to apply.
   */
  getClientWithAuth(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new InternalServerErrorException(
        'SUPABASE_URL and SUPABASE_ANON_KEY are required for user-scoped clients.',
      );
    }

    // create a client per request with the anon key and set the Authorization header
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    return client;
  }
}
