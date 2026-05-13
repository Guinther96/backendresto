import { SupabaseService } from '../../database/supabase.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
export declare class RestaurantsService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findAll(): Promise<unknown[]>;
    findOne(id: string): Promise<unknown>;
    findMine(restaurantId: string): Promise<unknown>;
    update(restaurantId: string, dto: UpdateRestaurantDto): Promise<unknown>;
}
