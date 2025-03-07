import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, EditOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';

type OrderItems = CreateOrderDto['orderItems'] | EditOrderDto['orderItems'];
type DbOrderItem = OrderItems[number] & { id: number };
type DbOrderItems = DbOrderItem[];

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
      getOrder: () => order,
      valid: () => order.status === OrderStatus.PENDING,
    };
  };

  // duplicateOrderItemHelperFn(items: OrderItems) {
  //   const findDuplicateOrderItems = (items: OrderItems) =>
  //     items
  //       .map((item) => item.productId)
  //       .reduce(
  //         ({ seen, duplicates }, id) => ({
  //           duplicates: seen.has(id) ? [...duplicates, id] : duplicates,
  //           seen: seen.has(id) ? seen : seen.add(id), // normally it does not need to be like this but somehow new Set() doesn't work
  //         }),
  //         { seen: new Set(), duplicates: [] },
  //       ).duplicates;

  //   const duplicates = findDuplicateOrderItems(items);

  //   const checkDuplicateOrderItem = () => {
  //     if (duplicates.length > 0) {
  //       throw new ForbiddenException('Duplicate order items found');
  //     }
  //   };

  //   return {
  //     getDuplicates: () => duplicates,
  //     check: checkDuplicateOrderItem,
  //   };
  // }

  onCategorizeItems({
    orderItems,
    dbOrderItems,
  }: {
    orderItems: OrderItems;
    dbOrderItems: DbOrderItems;
  }) {
    const dbMap = new Map(dbOrderItems.map((item) => [item.productId, item]));

    const itemsToCreate: OrderItems = [],
      itemsToUpdate: DbOrderItems = [],
      itemsToDelete: DbOrderItems = [];

    for (const orderItem of orderItems) {
      const dbItem = dbMap.get(orderItem.productId);
      if (!dbItem) {
        itemsToCreate.push(orderItem);
      } else if (
        orderItem.quantity !== dbItem.quantity ||
        orderItem.price !== dbItem.price
      ) {
        itemsToUpdate.push(dbItem);
      }
      dbMap.delete(orderItem.productId); // Remove from map to track deletions
    }

    // Remaining items in dbMap are those that need to be deleted
    itemsToDelete.push(...dbMap.values());

    return {
      getItems: () => ({
        itemsToCreate,
        itemsToUpdate,
        itemsToDelete,
      }),
    };
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    // * can move logic into a pipe
    // const duplicateItemsHelper = this.duplicateOrderItemHelperFn(
    //   dto.orderItems,
    // );
    // duplicateItemsHelper.check();

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

  async editOrderById(userId: number, orderId: number, dto: EditOrderDto) {
    const { orderItems, ...orderData } = dto;

    const orderHelper = await this.orderHelperFn(userId, orderId);
    // * can move logic into a pipe
    // const duplicateItemsHelper = this.duplicateOrderItemHelperFn(orderItems);
    // duplicateItemsHelper.check();

    if (!orderHelper.valid()) {
      throw new ForbiddenException(
        'Invalid data: Order is already COMPLETED or CANCELED',
      );
    }

    const dbOrderItems = await this.prismaService.orderItem.findMany({
      where: { orderId },
    });

    const { itemsToCreate, itemsToUpdate, itemsToDelete } =
      this.onCategorizeItems({ orderItems, dbOrderItems }).getItems();

    return await this.prismaService.$transaction(async (prisma) => {
      // Update order details
      const updatedOrder = await prisma.order.update({
        where: { userId, id: orderId },
        data: orderData,
      });

      // Create new items
      if (itemsToCreate.length) {
        await prisma.orderItem.createMany({
          data: itemsToCreate.map((item) => ({ ...item, orderId })),
        });
      }

      // Update existing items in parallel
      await Promise.all(
        itemsToUpdate.map((item) =>
          prisma.orderItem.update({
            where: { id: item.id, orderId },
            data: { ...item, orderId },
          }),
        ),
      );

      // Delete removed items
      if (itemsToDelete.length) {
        await prisma.orderItem.deleteMany({
          where: {
            OR: itemsToDelete.map(({ id }) => ({ id, orderId })),
          },
        });
      }

      return updatedOrder;
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
        ...orderHelper.getOrder(),
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
        ...orderHelper.getOrder(),
        status: OrderStatus.CANCELED,
        completedAt: new Date(),
      },
    });
  }
}
