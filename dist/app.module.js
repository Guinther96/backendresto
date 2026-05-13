"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const menu_module_1 = require("./modules/menu/menu.module");
const orders_module_1 = require("./modules/orders/orders.module");
const restaurants_module_1 = require("./modules/restaurants/restaurants.module");
const tables_module_1 = require("./modules/tables/tables.module");
const database_module_1 = require("./database/database.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const auth_module_1 = require("./modules/auth/auth.module");
const staff_module_1 = require("./modules/staff/staff.module");
const kitchen_module_1 = require("./modules/kitchen/kitchen.module");
const pairing_module_1 = require("./modules/pairing/pairing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            realtime_module_1.RealtimeModule,
            restaurants_module_1.RestaurantsModule,
            tables_module_1.TablesModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            auth_module_1.AuthModule,
            staff_module_1.StaffModule,
            kitchen_module_1.KitchenModule,
            pairing_module_1.PairingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map