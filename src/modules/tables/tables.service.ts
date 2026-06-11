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
    if (typeof qrCode !== 'string' || qrCode.trim().length === 0) {
      throw new BadRequestException('qrCode is required');
    }

    const normalizedQrCode = qrCode.trim();

    const tableByExactQr = await this.findByExactQrCode(normalizedQrCode);
    if (tableByExactQr) {
      return {
        ...tableByExactQr,
        qr_payload: {
          restaurant_id: tableByExactQr.restaurant_id,
          number: tableByExactQr.number,
        },
      };
    }

    const decodedPayload = this.extractQrPayloadFromUrl(normalizedQrCode);
    if (decodedPayload && decodedPayload !== normalizedQrCode) {
      const tableByDecodedQr = await this.findByExactQrCode(decodedPayload);
      if (tableByDecodedQr) {
        return {
          ...tableByDecodedQr,
          qr_payload: {
            restaurant_id: tableByDecodedQr.restaurant_id,
            number: tableByDecodedQr.number,
          },
        };
      }
    }

    const { restaurantId, tableNumber } = this.parseTableQrCode(
      decodedPayload ?? normalizedQrCode,
    );

    const { data, error } = await this.supabaseService
      .getAnonClient()
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

    const rows = (data ?? []) as Record<string, any>[];
    return rows.map((r) => this.normalizeTableRow(r));
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

    return this.normalizeTableRow(data as Record<string, any>);
  }

  async findOneForRestaurant(
    id: string,
    restaurantId: string,
  ): Promise<unknown> {
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

    return this.normalizeTableRow(data as Record<string, any>);
  }

  async create(
    createTableDto: CreateTableDto,
    restaurantIdOverride?: string,
  ): Promise<unknown> {
    const restaurantId = restaurantIdOverride;
    if (!restaurantId) {
      throw new InternalServerErrorException(
        'Authenticated restaurant_id is required',
      );
    }
    const frontendUrl = (
      process.env.FRONTEND_URL ?? 'https://orderclient.netlify.app'
    ).replace(/\/$/, '');
    const qrCode = `${frontendUrl}/?restaurant_id=${restaurantId}&table=${createTableDto.number}`;

    const { data, error } = await this.supabaseService
      .getAnonClient()
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        number: createTableDto.number,
        qr_code: qrCode,
        ...(createTableDto.capacity !== undefined
          ? { capacity: createTableDto.capacity }
          : {}),
      })
      .select('*')
      .single();

    if (error?.code === '23505') {
      throw new ConflictException(
        'A table with this number already exists for this restaurant',
      );
    }

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to create table',
      );
    }

    return this.normalizeTableRow(data as Record<string, any>);
  }

  private normalizeTableRow(row: Record<string, any>): Record<string, any> {
    const frontendUrl = (process.env.FRONTEND_URL ?? 'https://orderclient.netlify.app').replace(/\/$/, '');

    // Prefer explicit qr_token if provided by backend
    const token = row.qr_token ?? row.qrToken ?? row.qr_code;

    if (typeof token === 'string' && token.trim().length > 0) {
      // If token is a full URL, try to normalize `/menu/<id>?table=n` -> `/?restaurant_id=<id>&table=n`
      try {
        const url = new URL(token);

        // If URL already contains restaurant_id or restaurantId param, use it as-is
        if (url.searchParams.has('restaurant_id') || url.searchParams.has('restaurantId')) {
          return { ...row, qr_code: token };
        }

        // Match /menu/<restaurantId> pattern in the path
        const menuMatch = url.pathname.match(/\/menu\/(?:@?)([^\/\?]+)/i);
        const tableParam = url.searchParams.get('table') ?? url.searchParams.get('number');

        if (menuMatch) {
          const rid = menuMatch[1];
          const table = tableParam ?? row.number ?? url.hash.replace(/^#/, '');
          if (rid) {
            const built = `${frontendUrl}/?restaurant_id=${encodeURIComponent(rid)}${table ? `&table=${encodeURIComponent(String(table))}` : ''}`;
            return { ...row, qr_code: built };
          }
        }

        // If token is a URL but doesn't match known patterns, return as-is
        return { ...row, qr_code: token };
      } catch {
        // Not a URL — if it looks like internal qr payload 'table:...' keep as-is
        return { ...row, qr_code: token };
      }
    }

    // No token found: if qr_code exists and looks like `table:<id>:<n>`, convert it
    if (typeof row.qr_code === 'string' && row.qr_code.startsWith('table:')) {
      try {
        const parts = row.qr_code.split(':');
        const rid = parts[1];
        const table = parts[2];
        if (rid && table) {
          const built = `${frontendUrl}/?restaurant_id=${encodeURIComponent(rid)}&table=${encodeURIComponent(table)}`;
          return { ...row, qr_code: built };
        }
      } catch {
        // fallthrough
      }
    }

    return row;
  }

  private parseTableQrCode(qrCode: string): {
    restaurantId: string;
    tableNumber: number;
  } {
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

  private async findByExactQrCode(
    qrCode: string,
  ): Promise<
    ({ restaurant_id: string; number: number } & Record<string, unknown>) | null
  > {
    const { data, error } = await this.supabaseService
      .getAnonClient()
      .from('tables')
      .select('*')
      .eq('qr_code', qrCode)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (
      (data as
        | ({ restaurant_id: string; number: number } & Record<string, unknown>)
        | null) ?? null
    );
  }

  private extractQrPayloadFromUrl(qrValue: string): string | null {
    try {
      const url = new URL(qrValue);

      const queryCandidates = [
        url.searchParams.get('qr'),
        url.searchParams.get('qrCode'),
        url.searchParams.get('qrcode'),
        url.searchParams.get('code'),
      ];

      for (const candidate of queryCandidates) {
        if (candidate && candidate.trim().length > 0) {
          return candidate.trim();
        }
      }

      const pathCandidates = [
        decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? ''),
        decodeURIComponent(url.hash.replace(/^#/, '')),
      ];

      for (const candidate of pathCandidates) {
        if (candidate && candidate.startsWith('table:')) {
          return candidate;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
