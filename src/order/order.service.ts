import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  orderHelperFn = async (userId: number, id: number) => {
    const order = await this.prismaService.order.findFirst({
      where: {
        userId,
        id,
      },
    });

    return {
      data: () => order,
      valid: () => order.status === OrderStatus.PENDING,
    };
  };

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
    const orderHelper = await this.orderHelperFn(userId, orderId);

    if (!orderHelper.valid()) {
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
    const orderHelper = await this.orderHelperFn(userId, orderId);

    if (!orderHelper.valid()) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    return await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...orderHelper.data(),
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  async cancelOrderById(userId: number, orderId: number) {
    const orderHelper = await this.orderHelperFn(userId, orderId);

    if (!orderHelper.valid()) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    return await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...orderHelper.data(),
        status: OrderStatus.CANCELED,
        completedAt: new Date(),
      },
    });
  }
}
