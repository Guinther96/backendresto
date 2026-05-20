import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { ResolveTableQrDto } from './dto/resolve-table-qr.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.tablesService.findOneForRestaurant(id, user.restaurantId);
  }

  @Post('resolve-qr')
  resolveQr(@Body() dto: ResolveTableQrDto) {
    return this.tablesService.resolveByQr(dto.qrCode);
  }

  @Get('restaurant/me')
  @UseGuards(JwtAuthGuard)
  getMyRestaurantTables(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.tablesService.findByRestaurant(user.restaurantId);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  findByRestaurantAlias(
    @CurrentUser() user: RequestUser,
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
  ) {
    if (!user.restaurantId || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('You can only access your own restaurant tables');
    }
    return this.tablesService.findByRestaurant(restaurantId);
  }

  @Get(':restaurantId')
  @UseGuards(JwtAuthGuard)
  findByRestaurant(
    @CurrentUser() user: RequestUser,
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
  ) {
    if (!user.restaurantId || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('You can only access your own restaurant tables');
    }
    return this.tablesService.findByRestaurant(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTableDto: CreateTableDto, @CurrentUser() user: RequestUser) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.tablesService.create(createTableDto, user.restaurantId);
  }
}
