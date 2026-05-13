import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { SupabaseService } from '../../database/supabase.service';

// Alphabet autorise pour les codes de couplage.
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Longueur fixe du code visible par l'utilisateur.
const CODE_LENGTH = 6;
// Duree de validite: 15 minutes.
const CODE_TTL_MS = 15 * 60 * 1000;
// Nombre maximal de tentatives en cas de collision de code.
const MAX_GENERATION_RETRIES = 8;

interface PairingCodeRow {
  id: string;
  code: string;
  restaurant_id: string;
  expires_at: string;
  used: boolean;
}

interface PairingCodeInsertRow {
  code: string;
  expires_at: string;
}

interface PairingCodeUpdatedRow {
  restaurant_id: string;
}

interface PairingCodeStateRow {
  used: boolean;
}

interface SupabaseErrorLike {
  message: string;
}

@Injectable()
export class PairingService {
  private readonly logger = new Logger(PairingService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateCode(
    restaurantId: string,
  ): Promise<{ code: string; expiresAt: string }> {
    const supabase = this.supabaseService.getClient();
    // Verifie que le restaurant existe avant de generer un code.
    await this.assertRestaurantExists(restaurantId);

    // Invalide les anciens codes pour garantir un seul code actif par restaurant.
    await supabase
      .from('pairing_codes')
      .delete()
      .eq('restaurant_id', restaurantId);

    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    // Tente de creer un code unique; recommence uniquement en cas de collision.
    for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt += 1) {
      const code = this.generateRandomCode();

      const { data, error } = (await supabase
        .from('pairing_codes')
        .insert({
          code,
          restaurant_id: restaurantId,
          expires_at: expiresAt.toISOString(),
          used: false,
        })
        .select('code, expires_at')
        .single()) as {
        data: PairingCodeInsertRow | null;
        error: SupabaseErrorLike | null;
      };

      if (!error && data) {
        return {
          code: data.code,
          expiresAt: data.expires_at,
        };
      }

      const message = error?.message ?? '';
      const isUniqueViolation =
        message.includes('duplicate key value') ||
        message.includes('pairing_codes_code_key');

      if (!isUniqueViolation) {
        throw new InternalServerErrorException(
          message || 'Failed to create pairing code',
        );
      }
    }

    throw new InternalServerErrorException(
      'Could not generate a unique pairing code',
    );
  }

  async connect(
    code: string,
  ): Promise<{ restaurantId: string; token: string }> {
    // Normalise le code saisi pour eviter les erreurs de casse/espaces.
    const normalizedCode = code.trim().toUpperCase();
    const supabase = this.supabaseService.getClient();

    const { data: pairingRow, error } = (await supabase
      .from('pairing_codes')
      .select('id, code, restaurant_id, expires_at, used')
      .eq('code', normalizedCode)
      .single()) as {
      data: PairingCodeRow | null;
      error: SupabaseErrorLike | null;
    };

    if (error || !pairingRow) {
      this.logger.warn(`Invalid pairing attempt with code ${normalizedCode}`);
      throw new UnauthorizedException('Invalid pairing code');
    }

    const row = pairingRow;

    // Refuse la reutilisation d'un code deja consomme.
    if (row.used) {
      this.logger.warn(`Already used pairing code ${normalizedCode}`);
      throw new UnauthorizedException('Pairing code already used');
    }

    // Refuse les codes expires.
    const expiresAt = new Date(row.expires_at);
    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      this.logger.warn(`Expired pairing code ${normalizedCode}`);
      throw new UnauthorizedException('Pairing code expired');
    }

    // Marque le code comme utilise de maniere atomique pour eviter un double usage concurrent.
    const { data: usedRow, error: updateError } = (await supabase
      .from('pairing_codes')
      .update({ used: true })
      .eq('id', row.id)
      .eq('used', false)
      .select('restaurant_id')
      .single()) as {
      data: PairingCodeUpdatedRow | null;
      error: SupabaseErrorLike | null;
    };

    if (updateError || !usedRow) {
      const { data: currentRow, error: currentError } = (await supabase
        .from('pairing_codes')
        .select('used')
        .eq('id', row.id)
        .single()) as {
        data: PairingCodeStateRow | null;
        error: SupabaseErrorLike | null;
      };

      if (!currentError && currentRow?.used) {
        // Silencieux : un autre client a utilisé le code en premier (comportement normal)
        throw new UnauthorizedException('Pairing code already used');
      }

      // Cas rare : l'update a échoué mais le code n'est pas used (erreur réseau ou DB)
      throw new UnauthorizedException('Pairing code is no longer valid');
    }

    const restaurantId = usedRow.restaurant_id;
    const expiresInRaw =
      this.configService.get<string>('KDS_JWT_EXPIRES_IN') ?? '12h';
    const expiresIn: number | StringValue = /^\d+$/.test(expiresInRaw)
      ? Number(expiresInRaw)
      : (expiresInRaw as StringValue);

    // Genere un JWT KDS rattache au restaurant.
    const token = await this.jwtService.signAsync(
      {
        sub: restaurantId,
        restaurantId,
        scope: 'kds',
      },
      { expiresIn },
    );

    return {
      restaurantId,
      token,
    };
  }

  async invalidateRestaurantCodes(
    restaurantId: string,
  ): Promise<{ invalidated: number; restaurantId: string }> {
    // Supprime tous les codes de couplage du restaurant (deconnexion globale des ecrans).
    const { error, count } = await this.supabaseService
      .getClient()
      .from('pairing_codes')
      .delete({ count: 'exact' })
      .eq('restaurant_id', restaurantId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      invalidated: count ?? 0,
      restaurantId,
    };
  }

  private async assertRestaurantExists(restaurantId: string): Promise<void> {
    // Verification defensive pour retourner une erreur explicite si l'id est inconnu.
    const { data, error } = await this.supabaseService
      .getClient()
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private generateRandomCode(): string {
    // Construit un code aleatoire caractere par caractere.
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
      code += CODE_CHARS[randomIndex];
    }
    return code;
  }
}
