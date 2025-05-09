import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { CreateOrderDto, EditOrderDto } from './dto';
import {
  OrderItemValidPipe,
  TableAvailabilityPipe,
  TaxValidPipe,
  TotalPriceValidPipe,
} from './pipe';

@UseGuards(JwtGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // create order
  @Post()
  createOrder(
    @GetUser('id') userId: number,
    @Body(
      TableAvailabilityPipe,
      OrderItemValidPipe,
      TaxValidPipe,
      TotalPriceValidPipe,
    )
    dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  // get orders
  @Get()
  getOrders(@GetUser('id') userId: number) {
    return this.orderService.getOrders(userId);
  }

  // get order by id
  @Get(':id')
  getOrderById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.getOrderById(userId, orderId);
  }

  // edit order by id
  @Patch(':id')
  editOrderById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
    @Body(
      TableAvailabilityPipe,
      OrderItemValidPipe,
      TaxValidPipe,
      TotalPriceValidPipe,
    )
    dto: EditOrderDto,
  ) {
    return this.orderService.editOrderById(userId, orderId, dto);
  }

  // delete order by id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOrderById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.deleteOrderById(userId, orderId);
  }

  // checkout by id
  @Patch(':id/checkout')
  checkoutOrderById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.checkoutOrderById(userId, orderId);
  }

  // cancel by id
  @Patch(':id/cancel')
  cancelOrderById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.cancelOrderById(userId, orderId);
  }
}
