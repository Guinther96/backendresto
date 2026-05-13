import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    findOne(id: string): Promise<unknown>;
    getMyRestaurantTables(user: RequestUser): Promise<unknown[]>;
    findByRestaurantAlias(restaurantId: string): Promise<unknown[]>;
    findByRestaurant(restaurantId: string): Promise<unknown[]>;
    create(createTableDto: CreateTableDto, user: RequestUser): Promise<unknown>;
}
