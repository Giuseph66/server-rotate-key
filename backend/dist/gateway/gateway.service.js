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
var GatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const key_rotation_service_1 = require("../key-pool/key-rotation.service");
const usage_service_1 = require("../usage/usage.service");
let GatewayService = GatewayService_1 = class GatewayService {
    constructor(prisma, keyRotation, usageService) {
        this.prisma = prisma;
        this.keyRotation = keyRotation;
        this.usageService = usageService;
        this.logger = new common_1.Logger(GatewayService_1.name);
    }
    normalizeBody(body) {
        if (!body)
            return {};
        if (typeof body === 'object' && body.model)
            return body;
        if (typeof body === 'string') {
            try {
                return JSON.parse(body);
            }
            catch (e) {
                return body;
            }
        }
        if (typeof body === 'object') {
            const keys = Object.keys(body);
            if (keys.length === 1 && body[keys[0]] === '') {
                try {
                    return JSON.parse(keys[0]);
                }
                catch (e) {
                }
            }
        }
        return body;
    }
    async proxyRequest(endpoint, body, tenantId) {
        const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
        const maxRetries = settings?.maxRetries || 3;
        const baseUrl = settings?.ollamaBaseUrl || 'https://api.ollama.com';
        const normalizedBody = this.normalizeBody(body);
        const excludeKeyIds = [];
        const keysUsed = [];
        let retryCount = 0;
        const startTime = Date.now();
        let finalModel = normalizedBody?.model;
        if (!finalModel && tenantId) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            finalModel = tenant?.defaultModel || 'llama3.2';
        }
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const selectedKey = attempt === 0
                ? await this.keyRotation.selectKey(tenantId)
                : await this.keyRotation.selectKeyExcluding(excludeKeyIds, tenantId);
            if (!selectedKey) {
                const latencyMs = Date.now() - startTime;
                this.logger.error('❌ No available keys in the pool');
                await this.usageService.logUsage({
                    tenantId,
                    endpoint,
                    model: finalModel,
                    status: 'FAILED',
                    statusCode: 503,
                    latencyMs,
                    retryCount,
                    errorMessage: 'No available API keys in pool',
                    requestBody: JSON.stringify(normalizedBody),
                });
                throw new common_1.HttpException({
                    error: 'No available API keys',
                    message: 'All keys are either in cooldown or disabled. Please try again later.',
                    keysUsed,
                }, 503);
            }
            this.logger.log(`🔑 Attempt ${attempt + 1}: Using key "${selectedKey.label}" (${selectedKey.id.slice(0, 8)}...)`);
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${selectedKey.key}`,
                    },
                    body: JSON.stringify({ ...normalizedBody, model: finalModel, stream: false }),
                    signal: AbortSignal.timeout(120000),
                });
                if (response.status === 429) {
                    this.logger.warn(`⚠️ Key "${selectedKey.label}" got 429 - rotating to next key`);
                    await this.keyRotation.markCoolingDown(selectedKey.id);
                    excludeKeyIds.push(selectedKey.id);
                    keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: '429_RATE_LIMITED' });
                    retryCount++;
                    continue;
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    const latencyMs = Date.now() - startTime;
                    keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: `ERROR_${response.status}` });
                    await this.keyRotation.recordUsage(selectedKey.id);
                    await this.usageService.logUsage({
                        tenantId,
                        apiKeyId: selectedKey.id,
                        apiKeyLabel: selectedKey.label,
                        endpoint,
                        model: finalModel,
                        status: 'FAILED',
                        statusCode: response.status,
                        latencyMs,
                        retryCount,
                        errorMessage: errorText,
                        requestBody: JSON.stringify(normalizedBody),
                        responseBody: errorText,
                    });
                    const outStatus = response.status === 401 ? 502 : response.status;
                    throw new common_1.HttpException({ error: 'Ollama API error', statusCode: response.status, message: errorText, keysUsed }, outStatus);
                }
                const data = await response.json();
                const latencyMs = Date.now() - startTime;
                keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'SUCCESS' });
                await this.keyRotation.recordUsage(selectedKey.id);
                const actualModel = data.model || finalModel;
                const inputText = JSON.stringify(normalizedBody);
                const outputText = JSON.stringify(data);
                const tokensInput = Math.ceil(inputText.length / 4);
                const tokensOutput = Math.ceil(outputText.length / 4);
                await this.usageService.logUsage({
                    tenantId,
                    apiKeyId: selectedKey.id,
                    apiKeyLabel: selectedKey.label,
                    endpoint,
                    model: actualModel,
                    status: retryCount > 0 ? 'RETRIED' : 'SUCCESS',
                    statusCode: 200,
                    latencyMs,
                    tokensInput,
                    tokensOutput,
                    retryCount,
                    requestBody: JSON.stringify(normalizedBody),
                    responseBody: JSON.stringify(data),
                });
                this.logger.log(`✅ Request successful via key "${selectedKey.label}" (${latencyMs}ms, ${retryCount} retries)`);
                return {
                    success: true,
                    data,
                    statusCode: 200,
                    retryCount,
                    keysUsed,
                    latencyMs,
                };
            }
            catch (error) {
                if (error instanceof common_1.HttpException)
                    throw error;
                const latencyMs = Date.now() - startTime;
                keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'NETWORK_ERROR' });
                await this.usageService.logUsage({
                    tenantId,
                    apiKeyId: selectedKey.id,
                    apiKeyLabel: selectedKey.label,
                    endpoint,
                    model: normalizedBody?.model,
                    status: 'FAILED',
                    statusCode: 0,
                    latencyMs,
                    retryCount,
                    errorMessage: error.message,
                    requestBody: JSON.stringify(normalizedBody),
                });
                throw new common_1.HttpException({ error: 'Network error', message: error.message, keysUsed }, 502);
            }
        }
        const latencyMs = Date.now() - startTime;
        await this.usageService.logUsage({
            tenantId,
            endpoint,
            model: normalizedBody?.model,
            status: 'FAILED',
            statusCode: 429,
            latencyMs,
            retryCount,
            errorMessage: 'All keys rate limited after max retries',
            requestBody: JSON.stringify(normalizedBody),
        });
        throw new common_1.HttpException({
            error: 'All keys exhausted',
            message: `All available keys were rate limited after ${retryCount} retries.`,
            keysUsed,
        }, 429);
    }
    async proxyStreamRequest(endpoint, body, tenantId) {
        const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
        const maxRetries = settings?.maxRetries || 3;
        const baseUrl = settings?.ollamaBaseUrl || 'https://api.ollama.com';
        const normalizedBody = this.normalizeBody(body);
        const excludeKeyIds = [];
        const keysUsed = [];
        let retryCount = 0;
        const startTime = Date.now();
        let finalModel = normalizedBody?.model;
        if (!finalModel && tenantId) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            finalModel = tenant?.defaultModel || 'llama3.2';
        }
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const selectedKey = attempt === 0
                ? await this.keyRotation.selectKey(tenantId)
                : await this.keyRotation.selectKeyExcluding(excludeKeyIds, tenantId);
            if (!selectedKey) {
                throw new common_1.HttpException({ error: 'No available API keys', message: 'All keys are either in cooldown or disabled.', keysUsed }, 503);
            }
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${selectedKey.key}`,
                    },
                    body: JSON.stringify({ ...normalizedBody, model: finalModel, stream: true }),
                });
                if (response.status === 429) {
                    await this.keyRotation.markCoolingDown(selectedKey.id);
                    excludeKeyIds.push(selectedKey.id);
                    keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: '429_RATE_LIMITED' });
                    retryCount++;
                    continue;
                }
                if (!response.ok || !response.body) {
                    const errorText = await response.text();
                    const outStatus = response.status === 401 ? 502 : response.status;
                    throw new common_1.HttpException({ error: 'Ollama API error', message: errorText, keysUsed }, outStatus);
                }
                keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'SUCCESS' });
                await this.keyRotation.recordUsage(selectedKey.id);
                const latencyMs = Date.now() - startTime;
                await this.usageService.logUsage({
                    tenantId,
                    apiKeyId: selectedKey.id,
                    apiKeyLabel: selectedKey.label,
                    endpoint,
                    model: finalModel,
                    status: retryCount > 0 ? 'RETRIED' : 'SUCCESS',
                    statusCode: 200,
                    latencyMs,
                    retryCount,
                    requestBody: JSON.stringify(normalizedBody),
                    responseBody: '[Streaming Response]',
                });
                return { stream: response.body, keysUsed };
            }
            catch (error) {
                if (error instanceof common_1.HttpException)
                    throw error;
                throw new common_1.HttpException({ error: 'Network error', message: error.message, keysUsed }, 502);
            }
        }
        throw new common_1.HttpException({ error: 'All keys exhausted', message: 'All keys were rate limited.', keysUsed }, 429);
    }
    async listModels(tenantId) {
        const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
        const baseUrl = settings?.ollamaBaseUrl || 'https://api.ollama.com';
        const selectedKey = await this.keyRotation.selectKey(tenantId);
        if (!selectedKey) {
            throw new common_1.HttpException({ error: 'No available API keys' }, 503);
        }
        try {
            const response = await fetch(`${baseUrl}/api/tags`, {
                headers: { Authorization: `Bearer ${selectedKey.key}` },
                signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) {
                const outStatus = response.status === 401 ? 502 : response.status;
                throw new common_1.HttpException({ error: 'Failed to list models' }, outStatus);
            }
            return response.json();
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException({ error: 'Network error', message: error.message }, 502);
        }
    }
    async getSettings() {
        return this.prisma.settings.findUnique({ where: { id: 'global' } });
    }
    async updateSettings(data) {
        return this.prisma.settings.update({
            where: { id: 'global' },
            data,
        });
    }
};
exports.GatewayService = GatewayService;
exports.GatewayService = GatewayService = GatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        key_rotation_service_1.KeyRotationService,
        usage_service_1.UsageService])
], GatewayService);
//# sourceMappingURL=gateway.service.js.map