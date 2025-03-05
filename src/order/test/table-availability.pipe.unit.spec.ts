import { PrismaService } from 'src/prisma/prisma.service';
import { TableAvailabilityPipe } from '../pipe';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  TableStatus,
} from '@prisma/client';

const mockPrismaService = {
  table: {
    findFirst: jest.fn(),
  },
  order: {
    findFirst: jest.fn(),
  },
};

const mockValue = {
  tableId: 1,
  status: OrderStatus.PENDING,
  type: OrderType.POSTPAID,
  paymentMethod: PaymentMethod.CASH,
  subtotal: 10,
  totalPrice: 10,
};

describe('TableAvailabilityPipe', () => {
  let pipe: TableAvailabilityPipe;
  let prismaService: PrismaService;
  let requestMock: { method: 'POST' | 'PATCH' };

  beforeEach(async () => {
    requestMock = { method: 'POST' }; // Default to POST

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableAvailabilityPipe,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'REQUEST',
          useValue: requestMock,
        },
      ],
    }).compile();

    pipe = module.get<TableAvailabilityPipe>(TableAvailabilityPipe);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw NotFoundException if table does not exist', async () => {
    mockPrismaService.table.findFirst.mockResolvedValue(null);

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should allow order creation if table is available for POST request', async () => {
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 1,
      name: 'Table 1',
      status: TableStatus.AVAILABLE,
    });

    const value = {
      ...mockValue,
    };

    const result = await pipe.transform(value, {} as any);
    expect(result).toEqual(value);
  });

  it('should throw ConflictException if table is occupied for POST request', async () => {
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 1,
      name: 'Table 1',
      status: TableStatus.OCCUPIED,
    });

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should pass if table is available on PATCH', async () => {
    requestMock.method = 'PATCH';
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 2,
      name: 'Table 2',
      status: TableStatus.AVAILABLE,
    });
    mockPrismaService.order.findFirst.mockResolvedValue({
      ...mockValue,
    });

    await expect(
      pipe.transform(
        {
          ...mockValue,
          subtotal: 20,
          totalPrice: 20,
        },
        {} as any,
      ),
    ).resolves.toEqual({
      ...mockValue,
      subtotal: 20,
      totalPrice: 20,
    });
  });

  it('should throw NotFoundException if no previous order is found on PATCH', async () => {
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 1,
      name: 'Table 1',
      status: TableStatus.AVAILABLE,
    });
    mockPrismaService.order.findFirst.mockResolvedValue(null);
    requestMock.method = 'PATCH';

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if moving to an occupied table on PATCH', async () => {
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 1,
      name: 'Table 1',
      status: TableStatus.OCCUPIED,
    });
    mockPrismaService.order.findFirst.mockResolvedValue({ id: 10 });
    requestMock.method = 'PATCH';

    await expect(pipe.transform({ ...mockValue }, {} as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should pass if editing order is from the same table', async () => {
    requestMock.method = 'PATCH';
    mockPrismaService.table.findFirst.mockResolvedValue({
      id: 1,
      name: 'Table 1',
      status: TableStatus.OCCUPIED,
    });
    mockPrismaService.order.findFirst.mockResolvedValue({
      ...mockValue,
    });

    await expect(
      pipe.transform(
        {
          ...mockValue,
        },
        {} as any,
      ),
    ).resolves.toEqual({
      ...mockValue,
    });
  });
});
