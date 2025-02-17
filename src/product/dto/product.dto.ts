import { BundleItem, ProductType, UnitType } from '@prisma/client';
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

  @IsArray()
  @IsNotEmpty()
  bundleItems: BundleItem[] | [];

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

  @IsArray()
  @IsNotEmpty()
  bundleItems: BundleItem[] | [];

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
