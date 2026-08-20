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
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // 🔥 GET ONE TABLE (secure)
  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked');
    }

    return this.tablesService.findOneForRestaurant(id, user.restaurantId);
  }

  // 🔥 GET MY RESTAURANT TABLES (MAIN ENDPOINT)
  @Get('restaurant/me')
  getMyRestaurantTables(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked');
    }

    return this.tablesService.findByRestaurant(user.restaurantId);
  }

  // 🔥 CREATE TABLE (secure)
  @Post()
  create(
    @Body() dto: CreateTableDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked');
    }

    return this.tablesService.create(dto, user.restaurantId);
  }
}