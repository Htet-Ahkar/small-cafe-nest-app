import { ForbiddenException } from '@nestjs/common';
import { TotalPriceValidPipe } from '../pipe';
import { Test, TestingModule } from '@nestjs/testing';
import { TaxCalculatorService } from 'src/app-services';

const mockOrderItems = [
  { productId: 1, quantity: 2, price: 40 },
  { productId: 2, quantity: 1, price: 20 },
];

describe('TotalPriceValidPipe', () => {
  let pipe: TotalPriceValidPipe;
  let taxCalculatorService: TaxCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotalPriceValidPipe,
        {
          provide: TaxCalculatorService,
          useValue: {
            calculate: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<TotalPriceValidPipe>(TotalPriceValidPipe);
    taxCalculatorService =
      module.get<TaxCalculatorService>(TaxCalculatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should pass validation when total price matches', async () => {
    const orderItems = mockOrderItems;
    const taxIds = [1]; // mock tax rate 7%
    const rounding = 0.0;
    const subtotal = 100;
    const totalPrice = 107;
    const dtoOrderItem = { orderItems, taxIds, rounding, subtotal, totalPrice };

    jest.spyOn(taxCalculatorService, 'calculate').mockResolvedValue({
      before_rounding_tax: 107,
    } as any);

    const result = await pipe.transform({ ...dtoOrderItem } as any, {} as any);

    expect(result).toEqual({
      orderItems,
      taxIds,
      rounding,
      subtotal,
      totalPrice,
    });
  });

  it('should throw an error when subtotal does not match', async () => {
    const orderItems = mockOrderItems;
    const taxIds = [1]; // mock tax rate 7%
    const rounding = 0;
    const subtotal = 120; // Incorrect subtotal
    const totalPrice = 100;
    const dtoOrderItem = { orderItems, taxIds, rounding, subtotal, totalPrice };

    await expect(
      pipe.transform({ ...dtoOrderItem } as any, {} as any),
    ).rejects.toThrow(new ForbiddenException('Subtotal price does not match'));
  });

  it('should throw an error when total price does not match', async () => {
    const orderItems = mockOrderItems;
    const taxIds = [1]; // mock tax rate 7%
    const rounding = 0;
    const subtotal = 100;
    const totalPrice = 110; // Incorrect total price
    const dtoOrderItem = { orderItems, taxIds, rounding, subtotal, totalPrice };

    jest.spyOn(taxCalculatorService, 'calculate').mockResolvedValue({
      before_rounding_tax: 107,
    } as any);

    await expect(
      pipe.transform({ ...dtoOrderItem } as any, {} as any),
    ).rejects.toThrow(new ForbiddenException('Total price does not match'));
  });
});
