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
const schedule_1 = require("@nestjs/schedule");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const key_pool_module_1 = require("./key-pool/key-pool.module");
const gateway_module_1 = require("./gateway/gateway.module");
const usage_module_1 = require("./usage/usage.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            key_pool_module_1.KeyPoolModule,
            gateway_module_1.GatewayModule,
            usage_module_1.UsageModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map