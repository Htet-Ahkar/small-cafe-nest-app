import { PrismaService } from 'src/prisma/prisma.service';
import { TaxValidPipe } from '../pipe/tax-valid.pipe';
import { CreateOrderDto, EditOrderDto } from '../dto';
import { OrderType, PaymentMethod } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  tax: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('TaxValidPipe', () => {
  let pipe: TaxValidPipe;
  let prismaService: PrismaService;

  const mockValue: CreateOrderDto | EditOrderDto = {
    tableId: 1,
    type: OrderType.POSTPAID,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 125,
    totalPrice: 134,
    rounding: 0.25,
    taxIds: [1, 2, 3, 4], // 7% tax
    orderItems: [
      { productId: 3, quantity: 1, price: 35 },
      { productId: 4, quantity: 2, price: 40 },
      { productId: 5, quantity: 2, price: 50 },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxValidPipe,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    pipe = module.get<TaxValidPipe>(TaxValidPipe);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return false if some tax IDs are missing', async () => {
    // const mockTaxIds = [1, 2, 3, 4];

    mockPrismaService.tax.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 }, // Missing ID 4
    ]);

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).rejects.toThrow(new ForbiddenException('Invalid tax found'));
    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: mockValue.taxIds },
      },
      select: { id: true },
    });
  });

  it('should return false if all tax IDs are missing', async () => {
    mockPrismaService.tax.findMany.mockResolvedValue([]);

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).rejects.toThrow(new ForbiddenException('Invalid tax found'));
    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: mockValue.taxIds },
      },
      select: { id: true },
    });
  });

  it('should return true if all tax IDs exist', async () => {
    mockPrismaService.tax.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).resolves.not.toThrow();
    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: mockValue.taxIds },
      },
      select: { id: true },
    });
  });
});
