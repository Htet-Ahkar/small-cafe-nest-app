import { PrismaService } from 'src/prisma/prisma.service';
import { OrderItemValidPipe } from '../pipe';
import { CreateOrderDto, EditOrderDto } from '../dto';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  product: {
    findFirst: jest.fn(),
  },
};

describe('OrderItemValidPipe', () => {
  let pipe: OrderItemValidPipe;
  let prismaService: PrismaService;

  const mockValue: CreateOrderDto | EditOrderDto = {
    tableId: 1,
    type: OrderType.POSTPAID,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 10.01,
    totalPrice: 10.01,
    orderItems: [
      { productId: 3, quantity: 1, price: 35 },
      { productId: 4, quantity: 2, price: 40 },
      { productId: 5, quantity: 2, price: 50 },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderItemValidPipe,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    pipe = module.get<OrderItemValidPipe>(OrderItemValidPipe);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw ForbiddenException if duplicate order item found', async () => {
    await expect(
      pipe.transform(
        {
          ...mockValue,
          orderItems: [
            { productId: 3, quantity: 1, price: 35 },
            { productId: 3, quantity: 2, price: 30 },
            { productId: 4, quantity: 2, price: 40 },
            { productId: 5, quantity: 2, price: 50 },
          ],
        },
        {} as any,
      ),
    ).rejects.toThrow(new ForbiddenException('Duplicate order items found'));
  });

  it('should throw ForbiddenException if product is not found', async () => {
    const productId = 3;

    mockPrismaService.product.findFirst.mockResolvedValue(null);

    await expect(
      pipe.transform(
        {
          ...mockValue,
          orderItems: [{ productId, quantity: 1, price: 35 }],
        },
        {} as any,
      ),
    ).rejects.toThrow(new ForbiddenException('Invalid order item found'));
    expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
      where: { id: productId },
    });
  });

  it('should throw ForbiddenException if price does not match', async () => {
    const productId = 3;

    mockPrismaService.product.findFirst.mockResolvedValue({
      productId: 3,
      quantity: 1,
      price: 30,
    });

    await expect(
      pipe.transform(
        {
          ...mockValue,
          orderItems: [{ productId, quantity: 1, price: 35 }],
        },
        {} as any,
      ),
    ).rejects.toThrow(new ForbiddenException('Invalid order item found'));

    expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
      where: { id: productId },
    });
  });

  it('should passif all order items are valid', async () => {
    const productId = 3;

    mockPrismaService.product.findFirst.mockResolvedValue({
      productId: 3,
      quantity: 1,
      price: 30,
    });

    await expect(
      pipe.transform(
        {
          ...mockValue,
          orderItems: [{ productId, quantity: 3, price: 30 }],
        },
        {} as any,
      ),
    ).resolves.not.toThrow();
    expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
      where: { id: productId },
    });
  });
});
