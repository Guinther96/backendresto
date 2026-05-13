import { SupabaseService } from '../../database/supabase.service';
export declare class RealtimeService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    notifyNewOrder(payload: {
        orderId: string;
        restaurantId: string;
        tableId: string;
    }): Promise<void>;
    notifyOrderStatusUpdated(payload: {
        orderId: string;
        restaurantId: string;
        status: string;
    }): Promise<void>;
}
