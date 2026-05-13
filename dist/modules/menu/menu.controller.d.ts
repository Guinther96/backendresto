import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    findMyMenu(user: RequestUser): Promise<unknown[]>;
    findMine(user: RequestUser): Promise<unknown[]>;
    findByRestaurantAlias(restaurantId: string): Promise<unknown[]>;
    findByRestaurant(restaurantId: string): Promise<unknown[]>;
    create(createMenuItemDto: CreateMenuItemDto, user: RequestUser): Promise<unknown>;
    update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<unknown>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
