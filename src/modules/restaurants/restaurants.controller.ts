import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  ParseUUIDPipe,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked to this account');
    }
    return this.restaurantsService.findMine(user.restaurantId);
  }

  @Get('me')
  findMine(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked to this account');
    }
    return this.restaurantsService.findMine(user.restaurantId);
  }

  @Put('me')
  updateMine(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateRestaurantDto,
  ) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked to this account');
    }
    return this.restaurantsService.update(user.restaurantId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    if (!user.restaurantId || user.restaurantId !== id) {
      throw new ForbiddenException('You can only access your own restaurant');
    }
    return this.restaurantsService.findOne(id);
  }
}
