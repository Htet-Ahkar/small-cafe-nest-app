import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
