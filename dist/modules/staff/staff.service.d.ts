import { SupabaseService } from '../../database/supabase.service';
import { AddStaffDto } from './dto/add-staff.dto';
export declare class StaffService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    getStaff(restaurantId: string): Promise<unknown[]>;
    addStaff(restaurantId: string, dto: AddStaffDto): Promise<unknown>;
    removeStaff(restaurantId: string, staffUserId: string): Promise<void>;
}
