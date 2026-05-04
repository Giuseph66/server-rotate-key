"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyPoolModule = void 0;
const common_1 = require("@nestjs/common");
const key_pool_service_1 = require("./key-pool.service");
const key_pool_controller_1 = require("./key-pool.controller");
const key_rotation_service_1 = require("./key-rotation.service");
let KeyPoolModule = class KeyPoolModule {
};
exports.KeyPoolModule = KeyPoolModule;
exports.KeyPoolModule = KeyPoolModule = __decorate([
    (0, common_1.Module)({
        controllers: [key_pool_controller_1.KeyPoolController],
        providers: [key_pool_service_1.KeyPoolService, key_rotation_service_1.KeyRotationService],
        exports: [key_pool_service_1.KeyPoolService, key_rotation_service_1.KeyRotationService],
    })
], KeyPoolModule);
//# sourceMappingURL=key-pool.module.js.map