import { KitchenService } from './kitchen.service';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
export declare class KitchenController {
    private readonly kitchenService;
    constructor(kitchenService: KitchenService);
    findMyKitchenSnapshot(user: RequestUser): Promise<unknown[]>;
    updateOrderStatus(user: RequestUser, id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<unknown>;
}
