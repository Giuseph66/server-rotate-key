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
exports.GatewayController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gateway_service_1 = require("./gateway.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let GatewayController = class GatewayController {
    constructor(gatewayService) {
        this.gatewayService = gatewayService;
    }
    async chat(body, req, res) {
        const tenantId = req.user?.id;
        if (body.stream) {
            try {
                const { stream, keysUsed } = await this.gatewayService.proxyStreamRequest('/api/chat', body, tenantId);
                res.setHeader('Content-Type', 'application/x-ndjson');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.setHeader('X-Keys-Used', JSON.stringify(keysUsed));
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                const pump = async () => {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            res.end();
                            return;
                        }
                        res.write(decoder.decode(value, { stream: true }));
                    }
                };
                await pump();
            }
            catch (error) {
                const status = error.getStatus ? error.getStatus() : 500;
                res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
            }
            return;
        }
        try {
            const result = await this.gatewayService.proxyRequest('/api/chat', body, tenantId);
            res.json(result);
        }
        catch (error) {
            const status = error.getStatus ? error.getStatus() : 500;
            res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
        }
    }
    async generate(body, req, res) {
        const tenantId = req.user?.id;
        if (body.stream) {
            try {
                const { stream, keysUsed } = await this.gatewayService.proxyStreamRequest('/api/generate', body, tenantId);
                res.setHeader('Content-Type', 'application/x-ndjson');
                res.setHeader('Transfer-Encoding', 'chunked');
                res.setHeader('X-Keys-Used', JSON.stringify(keysUsed));
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                const pump = async () => {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            res.end();
                            return;
                        }
                        res.write(decoder.decode(value, { stream: true }));
                    }
                };
                await pump();
            }
            catch (error) {
                const status = error.getStatus ? error.getStatus() : 500;
                res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
            }
            return;
        }
        try {
            const result = await this.gatewayService.proxyRequest('/api/generate', body, tenantId);
            res.json(result);
        }
        catch (error) {
            const status = error.getStatus ? error.getStatus() : 500;
            res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
        }
    }
    async listModels(req) {
        return this.gatewayService.listModels(req.user?.id);
    }
    async getSettings() {
        return this.gatewayService.getSettings();
    }
    async updateSettings(body) {
        return this.gatewayService.updateSettings(body);
    }
};
exports.GatewayController = GatewayController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy chat request to Ollama Cloud with key rotation' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy generate request to Ollama Cloud with key rotation' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('tags'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List available models from Ollama Cloud' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "listModels", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get gateway settings' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update gateway settings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "updateSettings", null);
exports.GatewayController = GatewayController = __decorate([
    (0, swagger_1.ApiTags)('Gateway'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [gateway_service_1.GatewayService])
], GatewayController);
//# sourceMappingURL=gateway.controller.js.map