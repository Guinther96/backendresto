import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MenuService } from '../menu/menu.service';

@Controller('restaurants')
export class RestaurantsPublicController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':id/menu')
  findMenu(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.menuService.findByRestaurant(id);
  }
}
