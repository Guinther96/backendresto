import { ForbiddenException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

describe('OrdersController - access control', () => {
  let controller: OrdersController;
  const mockService = {
    findByRestaurant: jest.fn(),
    findByRestaurantList: jest.fn(),
  } as unknown as OrdersService;

  beforeEach(() => {
    controller = new OrdersController(mockService);
  });

  it('forbids access when requesting another restaurant orders', () => {
    const user = { restaurantId: 'R1' } as any;
    const restaurantId = 'R2';
    const pagination = new PaginationQueryDto();
    pagination.page = 1;
    pagination.limit = 10;
    expect(() =>
      controller.findByRestaurant(user, restaurantId, pagination),
    ).toThrow(ForbiddenException);
  });

  it('allows access when restaurant matches', () => {
    const user = { restaurantId: 'R1' } as any;
    const restaurantId = 'R1';
    const pagination = new PaginationQueryDto();
    pagination.page = 1;
    pagination.limit = 10;
    (mockService.findByRestaurant as jest.Mock).mockReturnValue(
      Promise.resolve({ data: [], meta: {} }),
    );
    const res = controller.findByRestaurant(user, restaurantId, pagination);
    expect(res).toBeInstanceOf(Promise);
  });
});
