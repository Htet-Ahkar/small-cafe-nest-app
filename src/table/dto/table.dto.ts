import { ApiProperty } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TableStatus, enumName: 'TableStatus' })
  @IsEnum(TableStatus)
  @IsNotEmpty()
  status: TableStatus;

  @IsString()
  @IsOptional()
  description?: string;
}

export class EditTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TableStatus, enumName: 'TableStatus' })
  @IsEnum(TableStatus)
  @IsNotEmpty()
  status: TableStatus;

  @IsString()
  @IsOptional()
  description?: string;
}
