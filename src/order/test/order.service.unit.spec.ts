import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';

const mockPrismaService = {
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('OrderService', () => {
  let orderService: OrderService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  // Get
  describe('Get orders', () => {
    it('should get orders', async () => {
      const userId = 1;
      const orders = [{ id: 1, name: 'Order 1', userId }];
      (prismaService.order.findMany as jest.Mock).mockResolvedValue(orders);

      expect(await orderService.getOrders(userId)).toEqual(orders);
      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array if no orders exist', async () => {
      const userId = 1;
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);

      expect(await orderService.getOrders(userId)).toEqual([]);
    });
  });

  // Get by id
  describe('Get order by id', () => {
    it('should get a order by id', async () => {
      const userId = 1,
        orderId = 1;
      const order = { id: orderId, name: 'Order 1', userId };
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(order);

      expect(await orderService.getOrderById(userId, orderId)).toEqual(order);
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
    });

    it('should return null if user does not exist', async () => {
      const userId = 999,
        orderId = 1;
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      expect(await orderService.getOrderById(userId, orderId)).toBeNull();
    });

    it('should return null if order does not exist', async () => {
      const userId = 1,
        orderId = 999;
      (prismaService.order.findFirst as jest.Mock).mockResolvedValue(null);

      expect(await orderService.getOrderById(userId, orderId)).toBeNull();
    });
  });

  // Create
  describe('Create order', () => {
    it('should create a order', async () => {
      const userId = 1;
      const dto = {
        tableId: 1,
        status: OrderStatus.PENDING,
        type: OrderType.POSTPAID,
        paymentMethod: PaymentMethod.CASH,
        subtotal: 10.01,
        totalPrice: 10.01,
      };

      const createdOrder = { id: 1, ...dto, userId };
      (prismaService.order.create as jest.Mock).mockResolvedValue(createdOrder);

      expect(await orderService.createOrder(userId, dto)).toEqual(createdOrder);
      expect(prismaService.order.create).toHaveBeenCalledWith({
        data: { userId, ...dto },
      });
    });

    it('should handle creating a order with invalid data: status should be PENDING', async () => {
      const userId = 1;
      const dto = {
        tableId: 1,
        status: OrderStatus.COMPLETED || OrderStatus.CANCELED,
        type: OrderType.POSTPAID,
        paymentMethod: PaymentMethod.CASH,
        subtotal: 10.01,
        totalPrice: 10.01,
      };

      (prismaService.order.create as jest.Mock).mockRejectedValue(
        new Error('Invalid data: status should be PENDING'),
      );

      await expect(orderService.createOrder(userId, dto)).rejects.toThrow(
        'Invalid data: status should be PENDING',
      );
    });
  });

  // Edit
  describe('Edit order by id', () => {
    it('should edit a order by id', async () => {
      const userId = 1,
        orderId = 1;
      const dto = {
        tableId: 1,
        status: OrderStatus.PENDING,
        type: OrderType.POSTPAID,
        paymentMethod: PaymentMethod.CASH,
        subtotal: 10.01,
        totalPrice: 10.01,
      };
      const updatedOrder = { id: orderId, ...dto, userId };
      (prismaService.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      expect(await orderService.editOrderById(userId, orderId, dto)).toEqual(
        updatedOrder,
      );
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: { ...dto },
      });
    });

    it('should handle editing a non-existent order', async () => {
      const userId = 1,
        orderId = 999;
      const dto = {
        tableId: 1,
        status: OrderStatus.PENDING,
        type: OrderType.POSTPAID,
        paymentMethod: PaymentMethod.CASH,
        subtotal: 10.01,
        totalPrice: 10.01,
      };
      (prismaService.order.update as jest.Mock).mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.editOrderById(userId, orderId, dto),
      ).rejects.toThrow('Order not found');
    });
  });

  // Delete
  describe('Delete order by id', () => {
    it('should delete a order by id', async () => {
      const userId = 1,
        orderId = 1;
      const deletedOrder = {
        id: orderId,
        name: 'Deleted Order',
        userId,
      };
      (prismaService.order.delete as jest.Mock).mockResolvedValue(deletedOrder);

      expect(await orderService.deleteOrderById(userId, orderId)).toEqual(
        deletedOrder,
      );
      expect(prismaService.order.delete).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
    });

    it('should handle deleting a non-existent order', async () => {
      const userId = 1,
        orderId = 999;
      (prismaService.order.delete as jest.Mock).mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.deleteOrderById(userId, orderId),
      ).rejects.toThrow('Order not found');
    });
  });
});
