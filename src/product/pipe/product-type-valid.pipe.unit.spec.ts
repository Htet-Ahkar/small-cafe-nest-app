import { PrismaService } from 'src/prisma/prisma.service';
import { ProductTypeValidPipe } from './product-type-valid.pipe';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto, EditProductDto } from '../dto';
import { ProductType, UnitType } from '@prisma/client';

describe('ProductTypeValidPipe', () => {
  let pipe: ProductTypeValidPipe;
  let prismaService: PrismaService;

  const dto: CreateProductDto | EditProductDto = {
    categoryId: 1,
    name: 'Coffee',
    unit: UnitType.CUP,
    price: 5,
    trackStock: false,
    stock: 20,
    bundleItems: '[]',
    type: ProductType.BUNDLE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTypeValidPipe,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    pipe = module.get<ProductTypeValidPipe>(ProductTypeValidPipe);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should throw BadRequestException for invalid JSON', async () => {
    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems: 'invalid' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty array in Bundle type', async () => {
    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems: '[]' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-array bundleItems', async () => {
    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems: '{}' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for invalid bundle item structure', async () => {
    const bundleItems = JSON.stringify([{ productId: '1', quantity: 0 }]);
    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for invalid product type', async () => {
    (prismaService.product.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
    });

    const bundleItems = JSON.stringify([{ productId: 1, quantity: 1 }]);

    await expect(
      pipe.transform({ ...dto, type: ProductType.BUNDLE_ITEM, bundleItems }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for non-existent product', async () => {
    (prismaService.product.findUnique as jest.Mock).mockResolvedValue(null);

    const bundleItems = JSON.stringify([{ productId: 1, quantity: 1 }]);

    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should pass validation for valid bundle', async () => {
    (prismaService.product.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
    });

    const bundleItems = JSON.stringify([{ productId: 1, quantity: 1 }]);

    await expect(
      pipe.transform({ ...dto, type: 'BUNDLE', bundleItems }),
    ).resolves.toEqual({ ...dto, type: 'BUNDLE', bundleItems });
  });
});
