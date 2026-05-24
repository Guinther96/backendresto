import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { AddStaffDto } from './dto/add-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  getStaff(@CurrentUser() user: RequestUser) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.staffService.getStaff(user.restaurantId);
  }

  @Post()
  addStaff(@CurrentUser() user: RequestUser, @Body() dto: AddStaffDto) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.staffService.addStaff(user.restaurantId, dto);
  }

  @Delete(':staffUserId')
  removeStaff(
    @CurrentUser() user: RequestUser,
    @Param('staffUserId') staffUserId: string,
  ) {
    if (!user.restaurantId)
      throw new ForbiddenException('No restaurant linked');
    return this.staffService.removeStaff(user.restaurantId, staffUserId);
  }
}
