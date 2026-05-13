import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../../database/supabase.service';
export declare class KdsOrdersGateway implements OnGatewayConnection {
    private readonly supabaseService;
    private readonly logger;
    server: Server;
    constructor(supabaseService: SupabaseService);
    handleConnection(client: Socket): Promise<void>;
    onOrdersJoin(client: Socket, payload: {
        restaurantId?: string;
    }): Promise<void>;
    emitOrdersUpdated(restaurantId: string): Promise<void>;
    private getKitchenSnapshot;
    private roomName;
    private extractRestaurantId;
}
