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
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId) {
      throw new ForbiddenException('No restaurant linked to this account');
    }
    return this.restaurantsService.findMine(user.restaurantId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
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
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.restaurantsService.findOne(id);
  }
}
