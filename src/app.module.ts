import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TablesModule } from './modules/tables/tables.module';
import { DatabaseModule } from './database/database.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { StaffModule } from './modules/staff/staff.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { PairingModule } from './modules/pairing/pairing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RealtimeModule,
    RestaurantsModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    AuthModule,
    StaffModule,
    KitchenModule,
    PairingModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
