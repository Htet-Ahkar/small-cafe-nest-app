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

  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  trackStock: boolean;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @IsString()
  @IsNotEmpty()
  bundleItems: string;

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

  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  trackStock: boolean;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @IsString()
  @IsNotEmpty()
  bundleItems: string;

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
