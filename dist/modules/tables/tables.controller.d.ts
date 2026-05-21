import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { ResolveTableQrDto } from './dto/resolve-table-qr.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    findOne(user: RequestUser, id: string): Promise<unknown>;
    resolveQr(dto: ResolveTableQrDto & {
        qr_code?: string;
    }): Promise<unknown>;
    getMyRestaurantTables(user: RequestUser): Promise<unknown[]>;
    findByRestaurantAlias(user: RequestUser, restaurantId: string): Promise<unknown[]>;
    findByRestaurant(user: RequestUser, restaurantId: string): Promise<unknown[]>;
    create(createTableDto: CreateTableDto, user: RequestUser): Promise<unknown>;
}
