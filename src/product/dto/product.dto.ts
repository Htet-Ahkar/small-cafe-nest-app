import { ApiProperty } from '@nestjs/swagger';
import { ProductType, UnitType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UnitType, enumName: 'UnitType' })
  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  trackStock: boolean = false;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @ApiProperty({
    example: '[{"productId":1,"quantity":2}]',
    description:
      'JSON string representing an array of bundle items. If type is BUNDLE, this should not be empty. Vice versa.',
  })
  @IsString()
  @IsNotEmpty()
  bundleItems: string = '[]';

  @ApiProperty({ enum: ProductType, enumName: 'ProductType' })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageLink?: string;
}

export class EditProductDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UnitType, enumName: 'UnitType' })
  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  trackStock: boolean = false;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @ApiProperty({
    example: '[{"productId":1,"quantity":2}]',
    description:
      'JSON string representing an array of bundle items. If type is BUNDLE, this should not be empty. Vice versa.',
  })
  @IsString()
  @IsNotEmpty()
  bundleItems: string = '[]';

  @ApiProperty({ enum: ProductType, enumName: 'ProductType' })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageLink?: string;
}

export class BundleItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
