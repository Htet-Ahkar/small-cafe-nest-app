import {
  ArgumentMetadata,
  ForbiddenException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateOrderDto, EditOrderDto } from '../dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaxValidPipe implements PipeTransform {
  constructor(private readonly prismaService: PrismaService) {}

  async transform(
    value: CreateOrderDto | EditOrderDto,
    metadata: ArgumentMetadata,
  ) {
    const { taxIds } = value;

    const tax = await this.prismaService.tax.findMany({
      where: {
        id: { in: taxIds },
      },
      select: { id: true },
    });

    if (tax.length !== taxIds.length) {
      throw new ForbiddenException('Invalid tax found');
    }

    return value;
  }
}
