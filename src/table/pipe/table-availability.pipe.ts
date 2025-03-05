import {
  PipeTransform,
  Injectable,
  NotFoundException,
  ConflictException,
  ArgumentMetadata,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TableStatus } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CreateOrderDto, EditOrderDto } from 'src/order/dto';

@Injectable()
export class TableAvailabilityPipe implements PipeTransform {
  constructor(
    private prismaService: PrismaService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async transform(
    value: CreateOrderDto | EditOrderDto,
    metadata: ArgumentMetadata,
  ) {
    const { tableId } = value;
    const table = await this.prismaService.table.findFirst({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table does not exist.');
    }

    if (this.request.method === 'POST') {
      // For new orders, check if the table is already occupied
      if (table.status === TableStatus.OCCUPIED) {
        throw new ConflictException(`${table.name} is already occupied.`);
      }
    } else if (this.request.method === 'PATCH') {
      // Get the last order associated with this table
      const lastOrder = await this.prismaService.order.findFirst({
        where: { tableId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!lastOrder) {
        throw new NotFoundException('No previous order found.');
      }

      const isSameTable = lastOrder.tableId === tableId;

      // If trying to move to a different table that is occupied, block the request
      if (!isSameTable && table.status === TableStatus.OCCUPIED) {
        throw new ConflictException(
          `Cannot move to ${table.name}, it is already occupied.`,
        );
      }
    }

    return value;
  }
}
