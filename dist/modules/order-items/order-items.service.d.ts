import { SupabaseService } from '../../database/supabase.service';
export interface CreateOrderItemInput {
    order_id: string;
    menu_item_id: string;
    quantity: number;
    price: number;
}
export declare class OrderItemsService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    bulkInsert(items: CreateOrderItemInput[]): Promise<unknown[]>;
    findByOrder(orderId: string): Promise<unknown[]>;
}
