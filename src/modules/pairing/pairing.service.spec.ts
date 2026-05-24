import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PairingService } from './pairing.service';
import { SupabaseService } from '../../database/supabase.service';

function createQueryChain(responses: Array<{ data: unknown; error: unknown }>) {
  const chain: {
    select: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    insert: jest.Mock;
    eq: jest.Mock;
    single: jest.Mock;
  } = {
    select: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(async () => {
      const response = responses.shift();

      if (!response) {
        throw new Error('Unexpected query in pairing service test');
      }

      return response;
    }),
  };

  return chain;
}

describe('PairingService', () => {
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const supabaseService = {
    getClient: jest.fn(),
  } as unknown as SupabaseService;

  let service: PairingService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.get as jest.Mock).mockReturnValue('12h');
    (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-token');
    service = new PairingService(supabaseService, jwtService, configService);
  });

  it('returns a token for a valid pairing code', async () => {
    const chain = createQueryChain([
      {
        data: {
          id: 'code-1',
          code: 'YR8W8P',
          restaurant_id: 'restaurant-1',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          used: false,
        },
        error: null,
      },
      {
        data: {
          restaurant_id: 'restaurant-1',
        },
        error: null,
      },
    ]);

    (supabaseService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => chain),
    });

    const result = await service.connect(' yr8w8p ');

    expect(result).toEqual({
      restaurantId: 'restaurant-1',
      token: 'mock-token',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'restaurant-1',
        restaurantId: 'restaurant-1',
        scope: 'kds',
      },
      { expiresIn: '12h' },
    );
  });

  it('rejects a stale concurrent use without warning', async () => {
    const chain = createQueryChain([
      {
        data: {
          id: 'code-1',
          code: 'YR8W8P',
          restaurant_id: 'restaurant-1',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          used: false,
        },
        error: null,
      },
      {
        data: null,
        error: null,
      },
      {
        data: {
          used: true,
        },
        error: null,
      },
    ]);

    (supabaseService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => chain),
    });

    const warnSpy = jest.spyOn(
      (service as unknown as { logger: { warn: jest.Mock } }).logger,
      'warn',
    );

    await expect(service.connect('YR8W8P')).rejects.toThrow(
      'Pairing code already used',
    );

    expect(warnSpy).not.toHaveBeenCalledWith(
      'Concurrent use detected for code YR8W8P',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
