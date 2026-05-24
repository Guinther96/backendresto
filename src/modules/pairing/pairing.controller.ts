import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PairingService } from './pairing.service';
import { GeneratePairingCodeDto } from './dto/generate-pairing-code.dto';
import { ConnectPairingCodeDto } from './dto/connect-pairing-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pairing')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generate(
    @CurrentUser() user: RequestUser,
    @Body() dto: GeneratePairingCodeDto,
  ) {
    if (!user.restaurantId || user.restaurantId !== dto.restaurantId) {
      throw new ForbiddenException(
        'You can only generate a code for your restaurant',
      );
    }
    return this.pairingService.generateCode(dto.restaurantId);
  }

  @Post('connect')
  connect(@Body() dto: ConnectPairingCodeDto) {
    return this.pairingService.connect(dto.code);
  }

  @Delete('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  invalidateRestaurantCodes(
    @CurrentUser() user: RequestUser,
    @Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
    restaurantId: string,
  ) {
    if (!user.restaurantId || user.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'You can only invalidate your restaurant codes',
      );
    }
    return this.pairingService.invalidateRestaurantCodes(restaurantId);
  }
}
