"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyPoolController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const key_pool_service_1 = require("./key-pool.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const api_key_dto_1 = require("./dto/api-key.dto");
let KeyPoolController = class KeyPoolController {
    constructor(keyPoolService) {
        this.keyPoolService = keyPoolService;
    }
    findAll() {
        return this.keyPoolService.findAll();
    }
    getPoolStatus() {
        return this.keyPoolService.getPoolStatus();
    }
    findOne(id) {
        return this.keyPoolService.findOne(id);
    }
    create(dto) {
        return this.keyPoolService.create(dto);
    }
    update(id, dto) {
        return this.keyPoolService.update(id, dto);
    }
    remove(id) {
        return this.keyPoolService.remove(id);
    }
    toggleActive(id) {
        return this.keyPoolService.toggleActive(id);
    }
    testKey(id) {
        return this.keyPoolService.testKey(id);
    }
    testAllKeys() {
        return this.keyPoolService.testAllKeys();
    }
};
exports.KeyPoolController = KeyPoolController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all API keys' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pool status overview' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "getPoolStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API key by ID' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new API key to the pool' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_key_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an API key' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, api_key_dto_1.UpdateApiKeyDto]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an API key from the pool' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle API key active/inactive' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Test a single API key' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "testKey", null);
__decorate([
    (0, common_1.Post)('test-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Test all active API keys' }),
    openapi.ApiResponse({ status: 201, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KeyPoolController.prototype, "testAllKeys", null);
exports.KeyPoolController = KeyPoolController = __decorate([
    (0, swagger_1.ApiTags)('Key Pool'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('api/keys'),
    __metadata("design:paramtypes", [key_pool_service_1.KeyPoolService])
], KeyPoolController);
//# sourceMappingURL=key-pool.controller.js.map