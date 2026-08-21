import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { KdsOrdersGateway } from './kds-orders.gateway';
import { OrderItemsModule } from '../order-items/order-items.module';

@Module({
  imports: [OrderItemsModule],
  providers: [RealtimeService, KdsOrdersGateway],
  exports: [RealtimeService, KdsOrdersGateway],
})
export class RealtimeModule {}
