import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KdsJwtGuard } from '../../common/guards/kds-jwt.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';

@Controller('kitchen')
@UseGuards(KdsJwtGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('orders/me')
  findMyKitchenSnapshot(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.kitchenService.findSnapshot(user.restaurantId);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.kitchenService.updateOrderStatus(
      user.restaurantId,
      id,
      updateOrderStatusDto,
    );
  }
}
