import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { KdsOrdersGateway } from './kds-orders.gateway';

@Module({
  providers: [RealtimeService, KdsOrdersGateway],
  exports: [RealtimeService, KdsOrdersGateway],
})
export class RealtimeModule {}
