// Remove multiple fields (e.g., `status` and `type`) from EditOrderDto
// export class ExampleOrderDto extends OmitType(BaseOrderDto, ['status', 'type'] as const) {}
import { ApiProperty } from '@nestjs/swagger';
import { OrderType, PaymentMethod } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsUniqueArray } from 'src/custom-validators';

export class BaseOrderDto {
  @IsNumber()
  @IsNotEmpty()
  tableId: number;

  @ApiProperty({ enum: OrderType, enumName: 'OrderType' })
  @IsEnum(OrderType)
  @IsNotEmpty()
  type: OrderType;

  @ApiProperty({ enum: PaymentMethod, enumName: 'PaymentMethod' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  orderItems: OrderItem[];

  @IsArray()
  @IsNotEmpty()
  @IsUniqueArray({ message: 'taxIds should not contain duplicate values' })
  taxIds: number[];

  @IsNumber()
  @IsNotEmpty()
  rounding: number = 0.0;

  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @IsNumber()
  @IsNotEmpty()
  totalPrice: number;

  @IsString()
  @IsOptional()
  description?: string;
}

class OrderItem {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}

export class CreateOrderDto extends BaseOrderDto {}

export class EditOrderDto extends BaseOrderDto {}
