import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My Ollama Key #1' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'ollama_sk_xxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ example: 'My Ollama Key - Updated' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 'ollama_sk_xxxxxxxxxxxx' })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
