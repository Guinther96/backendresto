import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';
import { OrdersModule } from '../orders/orders.module';
import { KdsJwtGuard } from '../../common/guards/kds-jwt.guard';

@Module({
  imports: [
    OrdersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('KDS_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('KDS_JWT_SECRET or JWT_SECRET is required');
        }

        return { secret };
      },
    }),
  ],
  controllers: [KitchenController],
  providers: [KitchenService, KdsJwtGuard],
})
export class KitchenModule {}
