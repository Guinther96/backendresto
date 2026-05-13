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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('id/:id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Get('restaurant/me')
  @UseGuards(JwtAuthGuard)
  getMyRestaurantTables(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.tablesService.findByRestaurant(user.restaurantId);
  }

  @Get('restaurant/:restaurantId')
  findByRestaurantAlias(
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
  ) {
    return this.tablesService.findByRestaurant(restaurantId);
  }

  @Get(':restaurantId')
  findByRestaurant(
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
  ) {
    return this.tablesService.findByRestaurant(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTableDto: CreateTableDto, @CurrentUser() user: RequestUser) {
    return this.tablesService.create(createTableDto, user.restaurantId ?? undefined);
  }
}
