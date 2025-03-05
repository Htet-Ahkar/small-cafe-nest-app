import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    return await this.prismaService.order.create({
      data: {
        ...dto,
        userId,
        status: OrderStatus.PENDING,
      },
    });
  }

  async getOrders(userId: number) {
    const order = await this.prismaService.order.findMany({
      where: { userId },
    });

    return order;
  }

  async getOrderById(userId: number, orderId: number) {
    const order = await this.prismaService.order.findFirst({
      where: {
        userId,
        id: orderId,
      },
    });

    return order;
  }

  async editOrderById(userId: number, orderId: number, dto: EditOrderDto) {
    const order = await this.prismaService.order.findFirst({
      where: {
        userId,
        id: orderId,
      },
    });
    const isOrderStatusValid = order.status === OrderStatus.PENDING;

    if (!isOrderStatusValid) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    return await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...dto,
      },
    });
  }

  async deleteOrderById(userId: number, orderId: number) {
    const order = await this.prismaService.order.delete({
      where: {
        userId,
        id: orderId,
      },
    });

    return order;
  }

  async checkoutOrderById(userId: number, orderId: number) {
    const order = await this.prismaService.order.findFirst({
      where: {
        userId,
        id: orderId,
      },
    });
    const isOrderStatusValid = order.status === OrderStatus.PENDING;

    if (!isOrderStatusValid) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    return await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...order,
        status: OrderStatus.COMPLETED,
      },
    });
  }

  async cancelOrderById(userId: number, orderId: number) {
    const order = await this.prismaService.order.findFirst({
      where: {
        userId,
        id: orderId,
      },
    });
    const isOrderStatusValid = order.status === OrderStatus.PENDING;

    if (!isOrderStatusValid) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    return await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...order,
        status: OrderStatus.CANCELED,
      },
    });
  }
}
