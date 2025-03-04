import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    if (dto.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Invalid data: status should be PENDING');
    }

    return await this.prismaService.order.create({
      data: {
        ...dto,
        userId,
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

  // This is not checkout
  async editOrderById(userId: number, orderId: number, dto: EditOrderDto) {
    if (dto.status === OrderStatus.CANCELED) {
      throw new ForbiddenException(
        'Invalid action: Orders must be canceled via the /cancel route.',
      );
    }

    if (dto.status === OrderStatus.COMPLETED) {
      throw new ForbiddenException(
        'Invalid action: Orders must be checkout via the /checkout route.',
      );
    }

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
}
