import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsUniqueArray } from 'src/custom-validators';

class BaseTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  rate: number;

  @IsBoolean()
  @IsNotEmpty()
  isFixed: boolean = false;

  @IsBoolean()
  @IsNotEmpty()
  isInclusive: boolean = false;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateTaxDto extends BaseTaxDto {}
export class EditTaxDto extends BaseTaxDto {}

export class CalculateTaxDto {
  @IsNumber()
  @IsNotEmpty()
  totalItemPrice: number;

  @IsArray()
  @IsUniqueArray({ message: 'taxIds should not contain duplicate values' })
  @IsNotEmpty()
  taxIds: number[];
}
