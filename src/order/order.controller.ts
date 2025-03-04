import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // create order
  @Post()
  createOrder() {}

  // get orders
  @Get()
  getOrders() {}

  // get order by id
  @Get(':id')
  getOrderById() {}

  // edit order by id // if order status is COMPELTED, don't allow to edit.
  @Patch(':id')
  editOrderById() {}

  // delete order by id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteorderById() {}
}
