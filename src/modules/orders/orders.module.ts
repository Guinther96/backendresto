import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderItemsModule } from '../order-items/order-items.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [OrderItemsModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
