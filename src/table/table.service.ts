import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTableDto, EditTableDto } from './dto';

@Injectable()
export class TableService {
  constructor(private prismaService: PrismaService) {}

  createTable(userId: number, dto: CreateTableDto) {}

  getTables(userId: number) {}

  getTableById(userId: number, tableId: number) {}

  editTableById(userId: number, tableId: number, dto: EditTableDto) {}

  deleteTableById(userId: number, tableId: number) {}
}
