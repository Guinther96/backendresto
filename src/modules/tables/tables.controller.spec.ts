import { ForbiddenException } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

describe('TablesController - access control', () => {
  let controller: TablesController;
  const mockService = {
    findOneForRestaurant: jest.fn(),
    findByRestaurant: jest.fn(),
    create: jest.fn(),
  } as unknown as TablesService;

  beforeEach(() => {
    controller = new TablesController(mockService);
  });

  it('forbids access to another restaurant table list', () => {
    const user = { restaurantId: 'R1' } as any;
    expect(() => controller.findByRestaurant(user, 'R2')).toThrow(
      ForbiddenException,
    );
  });

  it('allows access when restaurant matches for table list', () => {
    const user = { restaurantId: 'R1' } as any;
    (mockService.findByRestaurant as jest.Mock).mockReturnValue(
      Promise.resolve([]),
    );
    const result = controller.findByRestaurant(user, 'R1');
    expect(result).toBeInstanceOf(Promise);
  });
});
