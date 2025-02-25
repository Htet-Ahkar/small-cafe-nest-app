import {
  Injectable,
  PipeTransform,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { BundleItemDto, CreateProductDto, EditProductDto } from '../dto';
import { validateSync } from 'class-validator';

@Injectable()
export class ProductTypeValidPipe implements PipeTransform {
  constructor(private prismaService: PrismaService) {}

  async transform(value: CreateProductDto | EditProductDto) {
    const { type: productType, bundleItems: bundleItemsStr } = value;

    const parseJson = (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) {
          throw new BadRequestException('Expected an array of bundle items.');
        }
        return parsed;
      } catch {
        throw new BadRequestException('Invalid JSON format.');
      }
    };

    const validateBundleItem = async (item: any, index: number) => {
      const object = plainToInstance(BundleItemDto, item);
      const errors = validateSync(object);
      if (errors.length) {
        throw new BadRequestException(`Invalid bundle item at index ${index}.`);
      }

      const { productId, quantity } = object;
      if (quantity < 1) {
        throw new BadRequestException(
          `Quantity should be at least 1. Invalid bundle item at index ${index}.`,
        );
      }

      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product not found at index ${index}.`);
      }

      return object;
    };

    const bundleItems = parseJson(bundleItemsStr);
    const validatedBundleItems = await Promise.all(
      bundleItems.map(validateBundleItem),
    );

    const isBundle = productType === 'BUNDLE';
    if (isBundle && !validatedBundleItems.length) {
      throw new BadRequestException('bundleItems cannot be empty in Bundle.');
    }
    if (!isBundle && validatedBundleItems.length) {
      throw new BadRequestException(
        'bundleItems must be empty for non-BUNDLE types.',
      );
    }

    return value;
  }
}
