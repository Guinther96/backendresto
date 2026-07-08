import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMyMenu(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.menuService.findByRestaurant(user.restaurantId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.menuService.findByRestaurant(user.restaurantId);
  }

  // Legacy alias kept for compatibility; canonical route is /restaurants/:restaurantId/menu.
  @Get('restaurant/:restaurantId')
  findByRestaurantAlias(
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
    restaurantId: string,
  ) {
    return this.menuService.findByRestaurant(restaurantId);
  }

  @Get(':restaurantId')
  findByRestaurant(
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
    restaurantId: string,
  ) {
    return this.menuService.findByRestaurant(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.menuService.create(createMenuItemDto, user.restaurantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.menuService.updateForRestaurant(
      id,
      user.restaurantId,
      updateMenuItemDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.menuService.removeForRestaurant(id, user.restaurantId);
  }
}
