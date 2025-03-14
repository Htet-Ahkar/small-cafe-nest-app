import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  TableStatus,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { CreateOrderDto, EditOrderDto } from '../dto';

const mockPrismaService = {
  $transaction: jest.fn(),
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  table: {
    update: jest.fn(),
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
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
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
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
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
      const userId = 1,
        tableId = 1,
        dto: CreateOrderDto = {
          tableId,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
          rounding: 0.5, // !
          taxIds: [1], // !
          orderItems: [
            {
              productId: 1,
              quantity: 1,
              price: 10,
            },
          ],
        };

      const { orderItems, ...dtoData } = dto;

      const createdOrder = { ...dto, userId };
      const orderData = {
        ...dtoData,
        userId,
        OrderItems: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      };

      // Mock the behavior of $transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(createdOrder);
      mockPrismaService.table.update.mockResolvedValue({
        status: TableStatus.OCCUPIED,
      });

      expect(await orderService.createOrder(userId, dto)).toEqual(createdOrder);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: { ...orderData },
      });
    });
  });

  // todo: need to modify. can't test all prismaService
  // Edit
  describe('Edit order by id', () => {
    it('should successfully edit an order and update order items', async () => {
      // Arrange (Mock Data)
      const oldTableId = 1;
      const userId = 1,
        orderId = 1,
        dto: EditOrderDto = {
          tableId: 1,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          rounding: 0.5, // !
          taxIds: [1], // !
          subtotal: 10.01,
          totalPrice: 10.01,
          orderItems: [
            { productId: 3, quantity: 1, price: 35 },
            { productId: 4, quantity: 2, price: 40 },
            { productId: 5, quantity: 2, price: 50 },
          ],
        };

      const { orderItems, ...orderData } = dto;
      const updatedOrder = { id: orderId, ...dto, userId };

      const dbOrderItems = [
        { id: 1, productId: 1, quantity: 1, price: 10 },
        { id: 2, productId: 2, quantity: 1, price: 20 },
        { id: 3, productId: 3, quantity: 1, price: 30 },
      ];

      const categorizedItems = orderService.onCategorizeItems({
        dbOrderItems,
        orderItems,
      });

      const { itemsToCreate, itemsToUpdate, itemsToDelete } =
        categorizedItems.getItems();

      // Mock helper functions
      jest.spyOn(orderService, 'orderHelperFn').mockResolvedValue({
        getOrder: jest.fn(),
        valid: () => true, // need to mock
      });

      // Mock the behavior of $transaction
      mockPrismaService.order.findFirst.mockResolvedValue({
        tableId: oldTableId,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...updatedOrder,
      });
      mockPrismaService.orderItem.findMany.mockResolvedValue(dbOrderItems);
      mockPrismaService.orderItem.createMany.mockResolvedValue(itemsToCreate);
      mockPrismaService.orderItem.update.mockResolvedValue(dbOrderItems);
      mockPrismaService.orderItem.deleteMany.mockResolvedValue(dbOrderItems);

      // Act
      expect(await orderService.editOrderById(userId, orderId, dto)).toEqual({
        ...updatedOrder,
      });

      // Assert
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: orderData,
      });

      expect(mockPrismaService.orderItem.createMany).toHaveBeenCalledWith({
        data: itemsToCreate.map((item) => ({ ...item, orderId })),
      });

      itemsToUpdate.map((item) => {
        expect(mockPrismaService.orderItem.update).toHaveBeenCalledWith({
          where: { id: item.id, orderId },
          data: { ...item, orderId },
        });
      });

      expect(mockPrismaService.orderItem.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: itemsToDelete.map(({ id }) => ({ id, orderId })),
        },
      });
    });

    it.each([
      [
        OrderStatus.COMPLETED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
      [
        OrderStatus.CANCELED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
    ])(
      'should throw ForbiddenException if order status is %s',
      async (status, errorMessage) => {
        const userId = 1,
          orderId = 1;
        const dto: EditOrderDto = {
          tableId: 1,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          rounding: 0.5, // !
          taxIds: [1], // !
          subtotal: 10.01,
          totalPrice: 10.01,
          orderItems: [
            {
              productId: 1,
              quantity: 1,
              price: 10,
            },
          ],
        };
        const updatedOrder = { id: orderId, ...dto, userId };

        mockPrismaService.order.findFirst.mockResolvedValue({
          ...updatedOrder,
          status,
        });

        await expect(
          orderService.editOrderById(userId, orderId, dto),
        ).rejects.toThrow(new ForbiddenException(errorMessage));

        expect(mockPrismaService.order.update).not.toHaveBeenCalled();
      },
    );
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
      expect(mockPrismaService.order.delete).toHaveBeenCalledWith({
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
        order = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...order, userId };
      const completedAt = new Date();

      mockPrismaService.order.findFirst.mockResolvedValue(updatedOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.COMPLETED,
        completedAt,
      });

      expect(await orderService.checkoutOrderById(userId, orderId));
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: {
          ...updatedOrder,
          status: OrderStatus.COMPLETED,
          completedAt,
        },
      });
    });

    it.each([
      [
        OrderStatus.COMPLETED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
      [
        OrderStatus.CANCELED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
    ])(
      'should throw ForbiddenException if order status is %s',
      async (status, errorMessage) => {
        const userId = 1,
          orderId = 1;
        const order = {
          tableId: 1,
          status,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
          orderItems: [
            {
              productId: 1,
              quantity: 1,
              price: 10,
            },
          ],
        };
        const updatedOrder = { id: orderId, ...order, userId };

        mockPrismaService.order.findFirst.mockResolvedValue({
          ...updatedOrder,
        });

        await expect(
          orderService.checkoutOrderById(userId, orderId),
        ).rejects.toThrow(new ForbiddenException(errorMessage));

        expect(mockPrismaService.order.update).not.toHaveBeenCalled();
      },
    );
  });

  // Cancel
  describe('Cancel order by id', () => {
    it('should cancel an order by id', async () => {
      const userId = 1,
        orderId = 1,
        order = {
          tableId: 1,
          status: OrderStatus.PENDING,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
        },
        updatedOrder = { id: orderId, ...order, userId };
      const completedAt = new Date();

      mockPrismaService.order.findFirst.mockResolvedValue(updatedOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...updatedOrder,
        status: OrderStatus.CANCELED,
        completedAt,
      });

      expect(await orderService.cancelOrderById(userId, orderId));
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: { userId, id: orderId },
      });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { userId, id: orderId },
        data: {
          ...updatedOrder,
          status: OrderStatus.CANCELED,
          completedAt,
        },
      });
    });

    it.each([
      [
        OrderStatus.COMPLETED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
      [
        OrderStatus.CANCELED,
        'Invalid data: Order is already COMPLETED or CANCELED',
      ],
    ])(
      'should throw ForbiddenException if order status is %s',
      async (status, errorMessage) => {
        const userId = 1,
          orderId = 1;
        const order = {
          tableId: 1,
          type: OrderType.POSTPAID,
          status,
          paymentMethod: PaymentMethod.CASH,
          subtotal: 10.01,
          totalPrice: 10.01,
          orderItems: [
            {
              productId: 1,
              quantity: 1,
              price: 10,
            },
          ],
        };
        const updatedOrder = { id: orderId, ...order, userId };

        mockPrismaService.order.findFirst.mockResolvedValue({
          ...updatedOrder,
        });

        await expect(
          orderService.cancelOrderById(userId, orderId),
        ).rejects.toThrow(new ForbiddenException(errorMessage));

        expect(mockPrismaService.order.update).not.toHaveBeenCalled();
      },
    );
  });
});
