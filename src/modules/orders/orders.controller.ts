import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findKitchenSnapshot(
    @Query('restaurantId', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
  ) {
    return this.ordersService.findKitchenSnapshot(restaurantId);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('restaurant/me')
  @UseGuards(JwtAuthGuard)
  findMineByRestaurant(
    @CurrentUser() user: RequestUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.ordersService.findByRestaurantList(user.restaurantId, paginationQuery);
  }

  @Get('restaurant/:id')
  findByRestaurant(
    @Param('id', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.ordersService.findByRestaurant(restaurantId, paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
