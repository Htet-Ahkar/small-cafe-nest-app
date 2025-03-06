import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

type OrderItems = CreateOrderDto['orderItems'] | EditOrderDto['orderItems'];
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

  duplicateOrderItemHelperFn(items: OrderItems) {
    const findDuplicateOrderItems = (items: OrderItems) =>
      items
        .map((item) => item.productId)
        .reduce(
          ({ seen, duplicates }, id) => ({
            duplicates: seen.has(id) ? [...duplicates, id] : duplicates,
            seen: seen.has(id) ? seen : seen.add(id),
          }),
          { seen: new Set(), duplicates: [] },
        ).duplicates;

    const duplicates = findDuplicateOrderItems(items);

    const checkDuplicateOrderItem = () => {
      if (duplicates.length > 0) {
        throw new ForbiddenException('Duplicate order items found');
      }
    };

    return {
      duplicates,
      check: checkDuplicateOrderItem,
    };
  }

  findDuplicateOrderItems = (
    items: CreateOrderDto['orderItems'] | EditOrderDto['orderItems'],
  ) =>
    items
      .map((item) => item.productId)
      .reduce(
        ({ seen, duplicates }, id) => ({
          duplicates: seen.has(id) ? [...duplicates, id] : duplicates,
          seen: seen.has(id) ? seen : seen.add(id),
        }),
        { seen: new Set(), duplicates: [] },
      ).duplicates;

  async createOrder(userId: number, dto: CreateOrderDto) {
    const duplicateItemsHelper = this.duplicateOrderItemHelperFn(
      dto.orderItems,
    );
    duplicateItemsHelper.check();

    const orderData = {
      ...dto,
      userId,
      orderItems: {
        create: dto.orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    };

    return await this.prismaService.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: { ...orderData },
      });

      return order;
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

  // todo: need to implement order items update
  async editOrderById(userId: number, orderId: number, dto: EditOrderDto) {
    const orderHelper = await this.orderHelperFn(userId, orderId);
    const duplicateItemsHelper = this.duplicateOrderItemHelperFn(
      dto.orderItems,
    );
    duplicateItemsHelper.check();

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
