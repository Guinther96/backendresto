import { SupabaseService } from '../../database/supabase.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findByRestaurant(restaurantId: string): Promise<unknown[]>;
    findOne(id: string): Promise<unknown>;
    create(createTableDto: CreateTableDto, restaurantIdOverride?: string): Promise<unknown>;
}
