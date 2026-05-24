import { ForbiddenException } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

describe('MenuController - access control', () => {
  let controller: MenuController;
  const mockService = {
    findByRestaurant: jest.fn(),
    create: jest.fn(),
    updateForRestaurant: jest.fn(),
    removeForRestaurant: jest.fn(),
  } as unknown as MenuService;

  beforeEach(() => {
    controller = new MenuController(mockService);
  });

  it('forbids creating a menu item without restaurant', () => {
    const user = { restaurantId: null } as any;
    const dto = { name: 'Test', price: 10 } as CreateMenuItemDto;
    expect(() => controller.create(dto, user)).toThrow(ForbiddenException);
  });

  it('allows updating a menu item for matching restaurant', () => {
    const user = { restaurantId: 'R1' } as any;
    const dto = { name: 'Updated' } as UpdateMenuItemDto;
    (mockService.updateForRestaurant as jest.Mock).mockReturnValue(
      Promise.resolve({ id: 'item-1' }),
    );
    const result = controller.update(user, 'item-1', dto);
    expect(result).toBeInstanceOf(Promise);
  });
});
