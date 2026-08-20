import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesPublicController } from './tables.public.controller';
import { TablesService } from './tables.service';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [RestaurantsModule],
  // TablesPublicController must be registered before TablesController so
  // its static routes (e.g. GET /tables/validate) are matched before
  // TablesController's guarded GET /tables/:id.
  controllers: [TablesPublicController, TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
