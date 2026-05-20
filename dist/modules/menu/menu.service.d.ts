import { SupabaseService } from '../../database/supabase.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
export declare class MenuService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findByRestaurant(restaurantId: string): Promise<unknown[]>;
    create(createMenuItemDto: CreateMenuItemDto, restaurantIdOverride?: string): Promise<unknown>;
    update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<unknown>;
    updateForRestaurant(id: string, restaurantId: string, updateMenuItemDto: UpdateMenuItemDto): Promise<unknown>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    removeForRestaurant(id: string, restaurantId: string): Promise<{
        deleted: boolean;
    }>;
}
