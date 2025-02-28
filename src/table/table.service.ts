import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTableDto, EditTableDto } from './dto';

@Injectable()
export class TableService {
  constructor(private prismaService: PrismaService) {}

  async createTable(userId: number, dto: CreateTableDto) {
    const table = await this.prismaService.table.create({
      data: {
        userId,
        ...dto,
      },
    });

    return table;
  }

  async getTables(userId: number) {
    const table = await this.prismaService.table.findMany({
      where: { userId },
    });

    return table;
  }

  async getTableById(userId: number, tableId: number) {
    const table = await this.prismaService.table.findFirst({
      where: {
        userId,
        id: tableId,
      },
    });

    return table;
  }

  async editTableById(userId: number, tableId: number, dto: EditTableDto) {
    const table = await this.prismaService.table.update({
      where: {
        userId,
        id: tableId,
      },
      data: {
        ...dto,
      },
    });

    return table;
  }

  async deleteTableById(userId: number, tableId: number) {
    const table = await this.prismaService.table.delete({
      where: {
        userId,
        id: tableId,
      },
    });

    return table;
  }
}
