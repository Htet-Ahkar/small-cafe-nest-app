import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  // Get
  describe('Get orders', () => {
    it('should get orders', async () => {
      const userId = 1;
      const orders = [
        { id: 1, name: 'Order 1', userId },
        { id: 2, name: 'Order 2', userId },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(orders);

      expect(await orderService.getOrders(userId)).toEqual(orders);
      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array if no orders exist', async () => {
      const userId = 1;
      mockPrismaService.order.findMany.mockResolvedValue([]);

      expect(await orderService.getOrders(userId)).toEqual([]);
    });
  });

  // Get by id
  describe('Get order by id', () => {
    it('should get an order by id', async () => {
      const userId = 1,
        orderId = 1;
      const order = { id: orderId, name: 'Order 1', userId };
      mockPrismaService.order.findFirst.mockResolvedValue(order);

      expect(await orderService.getOrderById(userId, orderId)).toEqual(order);
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
    });

    it('should return null if order does not exist', async () => {
      const userId = 1,
        orderId = 999;
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      expect(await orderService.getOrderById(userId, orderId)).toBeNull();
    });
  });

  // Create
  describe('Create order', () => {
    it('should create an order', async () => {
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
      mockPrismaService.order.create.mockResolvedValue(createdOrder);

      expect(await orderService.createOrder(userId, dto)).toEqual(createdOrder);
      expect(prismaService.order.create).toHaveBeenCalledWith({
        data: { userId, ...dto },
      });
    });
  });

  // Edit
  describe('Edit order by id', () => {
    it('should edit an order by id', async () => {
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
      mockPrismaService.order.findFirst.mockResolvedValue(updatedOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      expect(await orderService.editOrderById(userId, orderId, dto)).toEqual(
        updatedOrder,
      );
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
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
      mockPrismaService.order.update.mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.editOrderById(userId, orderId, dto),
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenException if orde status is COMPLETED', async () => {
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
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        orderService.editOrderById(userId, orderId, dto),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if order status is CANCELED', async () => {
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
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.CANCELED,
      });

      await expect(
        orderService.editOrderById(userId, orderId, dto),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });
  });

  // Delete
  describe('Delete order by id', () => {
    it('should delete an order by id', async () => {
      const userId = 1,
        orderId = 1;
      const deletedOrder = {
        id: orderId,
        name: 'Deleted Order',
        userId,
      };
      mockPrismaService.order.delete.mockResolvedValue(deletedOrder);

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
      mockPrismaService.order.delete.mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.deleteOrderById(userId, orderId),
      ).rejects.toThrow('Order not found');
    });
  });

  // Checkout
  describe('Checkout order by id', () => {
    it('should checkout an order by id', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue(updatedOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.COMPLETED,
      });

      expect(await orderService.checkoutOrderById(userId, orderId));
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: { ...updatedOrder, status: OrderStatus.COMPLETED },
      });
    });

    it('should handle editing a non-existent order', async () => {
      const userId = 1,
        orderId = 999;

      mockPrismaService.order.update.mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.checkoutOrderById(userId, orderId),
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenException if order status is CANCELED', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.CANCELED,
      });

      await expect(
        orderService.checkoutOrderById(userId, orderId),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if order status is COMPLETED', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        orderService.checkoutOrderById(userId, orderId),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });
  });

  // Cancel
  describe('Cancel order by id', () => {
    it('should cancel an order by id', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue(updatedOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.CANCELED,
      });

      expect(await orderService.cancelOrderById(userId, orderId));
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: { ...updatedOrder, status: OrderStatus.CANCELED },
      });
    });

    it('should handle editing a non-existent order', async () => {
      const userId = 1,
        orderId = 999;

      mockPrismaService.order.update.mockRejectedValue(
        new Error('Order not found'),
      );

      await expect(
        orderService.cancelOrderById(userId, orderId),
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenException if order status is CANCELED', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.CANCELED,
      });

      await expect(
        orderService.cancelOrderById(userId, orderId),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if order status is COMPLETED', async () => {
      const userId = 1,
        orderId = 1,
        dto = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...dto, userId };

      mockPrismaService.order.findFirst.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        orderService.cancelOrderById(userId, orderId),
      ).rejects.toThrow(
        new ForbiddenException(
          'Invalid data: Order is already COMPLETED or CANCELED',
        ),
      );

      expect(prismaService.order.update).not.toHaveBeenCalled();
    });
  });
});
