import {
  ArgumentMetadata,
  ForbiddenException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateOrderDto, EditOrderDto } from '../dto';
import { TaxCalculatorService } from 'src/app-services';

@Injectable()
export class TotalPriceValidPipe implements PipeTransform {
  constructor(private readonly taxCalculatorService: TaxCalculatorService) {}

  async transform(
    value: CreateOrderDto | EditOrderDto,
    metadata: ArgumentMetadata,
  ) {
    const { orderItems, taxIds, rounding, subtotal, totalPrice } = value;

    // Calculate subtotal
    const totalItemPrice = orderItems.reduce(
      (total, { quantity, price }) => total + quantity * price,
      0,
    );

    if (totalItemPrice !== subtotal) {
      throw new ForbiddenException('Subtotal price does not match');
    }

    const { before_rounding_tax } = await this.taxCalculatorService.calculate({
      totalItemPrice,
      taxIds,
    });

    const total = before_rounding_tax + rounding;

    if (totalPrice !== total) {
      throw new ForbiddenException('Total price does not match');
    }

    return value;
  }
}
