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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateApiKeyDto = exports.CreateApiKeyDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateApiKeyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { label: { required: true, type: () => String }, key: { required: true, type: () => String }, tenantId: { required: false, type: () => String } };
    }
}
exports.CreateApiKeyDto = CreateApiKeyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Ollama Key #1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ollama_sk_xxxxxxxxxxxx' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-tenant' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "tenantId", void 0);
class UpdateApiKeyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { label: { required: false, type: () => String }, key: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, tenantId: { required: false, type: () => String } };
    }
}
exports.UpdateApiKeyDto = UpdateApiKeyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'My Ollama Key - Updated' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ollama_sk_xxxxxxxxxxxx' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateApiKeyDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-tenant' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "tenantId", void 0);
//# sourceMappingURL=api-key.dto.js.map