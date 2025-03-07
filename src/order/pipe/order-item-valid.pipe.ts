import {
  ArgumentMetadata,
  ForbiddenException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateOrderDto, EditOrderDto } from '../dto';
import { PrismaService } from 'src/prisma/prisma.service';

type OrderItems = CreateOrderDto['orderItems'] | EditOrderDto['orderItems'];

@Injectable()
export class OrderItemValidPipe implements PipeTransform {
  constructor(private readonly prismaService: PrismaService) {}

  async transform(
    value: CreateOrderDto | EditOrderDto,
    metadata: ArgumentMetadata,
  ) {
    const { orderItems } = value;

    const duplicateOrderItemHelperFn = (items: OrderItems) => {
      const findDuplicateOrderItems = (items: OrderItems) =>
        items
          .map((item) => item.productId)
          .reduce(
            ({ seen, duplicates }, id) => ({
              duplicates: seen.has(id) ? [...duplicates, id] : duplicates,
              seen: seen.has(id) ? seen : seen.add(id), // normally it does not need to be like this but somehow new Set() doesn't work
            }),
            { seen: new Set(), duplicates: [] },
          ).duplicates;

      const duplicates = findDuplicateOrderItems(items);

      const checkDuplicateOrderItem = () => {
        if (duplicates.length > 0) {
          throw new ForbiddenException('Duplicate order items found');
        }
      };

      return {
        getDuplicates: () => duplicates,
        check: checkDuplicateOrderItem,
      };
    };

    const duplicateItemsHelper = duplicateOrderItemHelperFn(orderItems);
    duplicateItemsHelper.check();

    await Promise.all(
      orderItems.map(async (item) => {
        const { productId, price } = item;

        const product = await this.prismaService.product.findFirst({
          where: { id: productId },
        });

        if (!product) {
          throw new ForbiddenException('Invalid order item found');
        }

        // check price
        if (product.price !== price) {
          throw new ForbiddenException('Invalid order item found');
        }
      }),
    );

    return value;
  }
}
