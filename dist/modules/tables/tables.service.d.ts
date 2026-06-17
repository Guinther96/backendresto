import { SupabaseService } from '../../database/supabase.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    resolveByQr(qrCode: string): Promise<unknown>;
    findByRestaurant(restaurantId: string): Promise<unknown[]>;
    findOne(id: string): Promise<unknown>;
    findOneForRestaurant(id: string, restaurantId: string): Promise<unknown>;
    create(createTableDto: CreateTableDto, restaurantIdOverride?: string): Promise<unknown>;
    private normalizeTableRow;
    private parseTableQrCode;
    private findByExactQrCode;
    private extractQrPayloadFromUrl;
}
