import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'my-tenant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'tenant@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'securepass123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user'] })
  @IsString()
  @IsOptional()
  role?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'my-tenant' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'tenant@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'newpass123' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user'] })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
