import { ForbiddenException } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsController - access control', () => {
  let controller: RestaurantsController;
  const mockService = {
    findOne: jest.fn(),
    findMine: jest.fn(),
    update: jest.fn(),
  } as unknown as RestaurantsService;

  beforeEach(() => {
    controller = new RestaurantsController(mockService);
  });

  it('forbids access to another restaurant via GET :id', () => {
    const user = { restaurantId: 'rest-A' } as any;
    const targetId = 'rest-B';
    expect(() => controller.findOne(user, targetId)).toThrow(
      ForbiddenException,
    );
  });

  it('allows access when restaurantId matches', () => {
    const user = { restaurantId: 'rest-A' } as any;
    const targetId = 'rest-A';
    (mockService.findOne as jest.Mock).mockReturnValue(
      Promise.resolve({ id: 'rest-A' }),
    );
    const res = controller.findOne(user, targetId);
    expect(res).toBeInstanceOf(Promise);
  });
});
