import { ApiProperty } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class BaseTableDto {
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

export class CreateTableDto extends BaseTableDto {}
export class EditTableDto extends BaseTableDto {}
