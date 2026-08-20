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
    jest.clearAllMocks();
  });

  it('forbids listing tables when no restaurant is linked', () => {
    const user = { restaurantId: null } as any;
    expect(() => controller.getMyRestaurantTables(user)).toThrow(
      ForbiddenException,
    );
  });

  it('lists tables for the authenticated user restaurant', () => {
    const user = { restaurantId: 'R1' } as any;
    (mockService.findByRestaurant as jest.Mock).mockReturnValue(
      Promise.resolve([]),
    );
    const result = controller.getMyRestaurantTables(user);
    expect(result).toBeInstanceOf(Promise);
    expect(mockService.findByRestaurant).toHaveBeenCalledWith('R1');
  });

  it('forbids creating a table when no restaurant is linked', () => {
    const user = { restaurantId: null } as any;
    expect(() => controller.create({ number: 1 } as any, user)).toThrow(
      ForbiddenException,
    );
  });

  it('creates a table for the authenticated user restaurant', () => {
    const user = { restaurantId: 'R1' } as any;
    (mockService.create as jest.Mock).mockReturnValue(
      Promise.resolve({ id: 't1', number: 1 }),
    );
    const result = controller.create({ number: 1 } as any, user);
    expect(result).toBeInstanceOf(Promise);
    expect(mockService.create).toHaveBeenCalledWith({ number: 1 }, 'R1');
  });
});
