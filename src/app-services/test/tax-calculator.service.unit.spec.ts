import { Test, TestingModule } from '@nestjs/testing';
import { TaxCalculatorService } from '../tax-calculator.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  tax: {
    findMany: jest.fn(),
  },
};

// !Need to add invalid tax edge case

describe('TaxCalculatorService', () => {
  let service: TaxCalculatorService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCalculatorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaxCalculatorService>(TaxCalculatorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate total price with tax correctly', async () => {
    const totalItemPrice = 50;
    const taxIds = [1, 2];

    const tax = [
      { id: 1, isFixed: true, rate: 5 },
      { id: 2, isFixed: false, rate: 7 },
    ];

    mockPrismaService.tax.findMany.mockResolvedValue(tax);

    const result = await service.calculate({
      totalItemPrice,
      taxIds,
    });

    expect(result.after_rounding_tax).toBe(59);
    expect(result.rounding).toBe(0.5);
    expect(result.before_rounding_tax).toBe(58.5);

    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: { id: { in: taxIds } },
    });
  });

  it('should handle no taxes correctly', async () => {
    const totalItemPrice = 100;
    const taxIds: number[] = []; // No taxes

    const tax = [];
    mockPrismaService.tax.findMany.mockResolvedValue(tax);

    const result = await service.calculate({
      totalItemPrice,
      taxIds,
    });

    expect(result.after_rounding_tax).toBe(100);
    expect(result.rounding).toBeCloseTo(0.0, 2);
    expect(result.before_rounding_tax).toBe(100);

    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: { id: { in: taxIds } },
    });
  });

  it('should calculate fixed tax only correctly', async () => {
    const fixedTax = [{ isFixed: true, rate: 5 }];

    const totalItemPrice = 100;
    const taxIds = [1];

    mockPrismaService.tax.findMany.mockResolvedValue(fixedTax);

    const result = await service.calculate({
      totalItemPrice,
      taxIds,
    });

    expect(result.after_rounding_tax).toBe(105);
    expect(result.rounding).toBeCloseTo(0.0, 2);
    expect(result.before_rounding_tax).toBe(105);

    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: { id: { in: taxIds } },
    });
  });

  it('should calculate percentage tax only correctly (rounding >= 0.5', async () => {
    const percentageTax = [{ isFixed: false, rate: 7 }];

    const totalItemPrice = 40;
    const taxIds = [1];

    mockPrismaService.tax.findMany.mockResolvedValue(percentageTax);

    const result = await service.calculate({
      totalItemPrice,
      taxIds,
    });

    expect(result.after_rounding_tax).toBe(43);
    expect(result.rounding).toBe(0.2);
    expect(result.before_rounding_tax).toBe(42.8);

    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: { id: { in: taxIds } },
    });
  });

  it('should calculate percentage tax only correctly (rounding < 0.5)', async () => {
    const percentageTax = [{ isFixed: false, rate: 5 }];

    const totalItemPrice = 105;
    const taxIds = [1];

    mockPrismaService.tax.findMany.mockResolvedValue(percentageTax);

    const result = await service.calculate({
      totalItemPrice,
      taxIds,
    });

    expect(result.after_rounding_tax).toBe(111);
    expect(result.rounding).toBe(0.75);
    expect(result.before_rounding_tax).toBe(110.25);

    expect(mockPrismaService.tax.findMany).toHaveBeenCalledWith({
      where: { id: { in: taxIds } },
    });
  });
});
