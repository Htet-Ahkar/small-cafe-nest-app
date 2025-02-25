import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { BundleItemDto } from '../dto';
import { validateSync } from 'class-validator';

@Injectable()
export class ProductTypeValidPipe implements PipeTransform {
  constructor(private prismaService: PrismaService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const productType: ProductType = value.type;
    const bundleItemsStr = value.bundleItems;

    const safeJsonParse = (jsonString, defaultValue = []) => {
      try {
        return JSON.parse(jsonString);
      } catch {
        throw new BadRequestException('Invalid JSON format.');
      }
    };

    const bundleItems = safeJsonParse(bundleItemsStr);

    // check type
    if (!Array.isArray(bundleItems)) {
      throw new BadRequestException('Expected an array of bundle items.');
    }

    const validatedBundleItems: BundleItemDto[] = await Promise.all(
      bundleItems.map(async (item, index) => {
        const object = plainToInstance(BundleItemDto, item);
        const errors = validateSync(object);

        if (errors.length > 0) {
          throw new BadRequestException(
            `Invalid bundle item at index ${index}.`,
          );
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
          throw new NotFoundException(
            `Product not found. Invalid bundle item at index ${index}.`,
          );
        }

        return object;
      }),
    );

    if (productType === 'BUNDLE') {
      if (validatedBundleItems.length === 0) {
        throw new BadRequestException('bundleItems cannot be empty in Bundle.');
      }
    }

    if (productType !== 'BUNDLE') {
      if (validatedBundleItems.length > 0) {
        throw new BadRequestException(
          'bundleItems is empty in BundleItem and Standalone type.',
        );
      }
    }

    return value;
  }
}
