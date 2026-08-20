import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { ResolveTableQrDto } from './dto/resolve-table-qr.dto';

@Controller('tables')
export class TablesPublicController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  // Public endpoint: an anonymous guest scanning a table QR code has no
  // token yet, so this route must stay outside JwtAuthGuard and must be
  // registered before TablesController's `:id` route or Express will match
  // "validate" as an id and 401 before this handler ever runs.
  @Get('validate')
  async validate(
    @Query('code') code?: string,
    @Query('restaurant_id') restaurantId?: string,
  ) {
    if (!restaurantId || !code) {
      throw new BadRequestException('restaurant_id and code are required');
    }

    const [restaurant, table] = await Promise.all([
      this.restaurantsService.findOne(restaurantId),
      this.tablesService.findByRestaurantAndCode(restaurantId, code),
    ]);

    const restaurantRow = restaurant as Record<string, any>;
    const tableRow = table as Record<string, any>;

    return {
      restaurant: {
        id: restaurantRow.id,
        name: restaurantRow.name,
      },
      table: {
        id: tableRow.id,
        number: tableRow.number,
        restaurantId: tableRow.restaurant_id,
        isActive: tableRow.is_active ?? true,
      },
    };
  }

  @Post('resolve-qr')
  resolveQr(@Body() dto: ResolveTableQrDto) {
    const qrCode = typeof (dto as any)?.qrCode === 'string'
      ? (dto as any).qrCode
      : typeof (dto as any)?.qr_code === 'string'
        ? (dto as any).qr_code
        : '';
    return this.tablesService.resolveByQr(qrCode);
  }
}
