import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    const isStatusValid = dto.status === OrderStatus.PENDING;

    if (isStatusValid) {
      return await this.prismaService.order.create({
        data: {
          ...dto,
          userId,
        },
      });
    } else {
      throw new ForbiddenException('Invalid data: status should be PENDING');
    }
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
    // need to add edge cases
    const order = await this.prismaService.order.update({
      where: { userId, id: orderId },
      data: {
        ...dto,
      },
    });

    return order;
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
