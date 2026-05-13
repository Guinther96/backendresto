import { RestaurantsService } from './restaurants.service';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
export declare class RestaurantsController {
    private readonly restaurantsService;
    constructor(restaurantsService: RestaurantsService);
    findAll(): Promise<unknown[]>;
    findMine(user: RequestUser): Promise<unknown>;
    updateMine(user: RequestUser, dto: UpdateRestaurantDto): Promise<unknown>;
    findOne(id: string): Promise<unknown>;
}
