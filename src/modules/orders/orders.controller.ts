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
  @UseGuards(JwtAuthGuard)
  findKitchenSnapshot(
    @CurrentUser() user: RequestUser,
  ) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.ordersService.findKitchenSnapshot(user.restaurantId);
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
  @UseGuards(JwtAuthGuard)
  findByRestaurant(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) restaurantId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    if (!user.restaurantId || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('You can only access your own restaurant orders');
    }
    return this.ordersService.findByRestaurant(restaurantId, paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.ordersService.findOneForRestaurant(id, user.restaurantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    if (!user.restaurantId) throw new ForbiddenException('No restaurant linked');
    return this.ordersService.updateStatusForRestaurant(
      id,
      user.restaurantId,
      updateOrderStatusDto,
    );
  }
}
