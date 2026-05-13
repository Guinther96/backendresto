import { StaffService } from './staff.service';
import { AddStaffDto } from './dto/add-staff.dto';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    getStaff(user: RequestUser): Promise<unknown[]>;
    addStaff(user: RequestUser, dto: AddStaffDto): Promise<unknown>;
    removeStaff(user: RequestUser, staffUserId: string): Promise<void>;
}
