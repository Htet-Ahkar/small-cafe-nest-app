import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TaxCalculatorService } from 'src/app-services';

@Module({
  controllers: [OrderController],
  providers: [OrderService, TaxCalculatorService],
})
export class OrderModule {}
