import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TableService } from './table.service';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { CreateTableDto, EditTableDto } from './dto';

@UseGuards(JwtGuard)
@Controller('table')
export class TableController {
  constructor(private tableService: TableService) {}

  // create table
  @Post()
  createTable(@GetUser('id') userId: number, @Body() dto: CreateTableDto) {
    return this.tableService.createTable(userId, dto);
  }

  // get tables
  @Get()
  getTables(@GetUser('id') userId: number) {
    return this.tableService.getTables(userId);
  }

  // get table by id
  @Get(':id')
  getTableById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) tableId: number,
  ) {
    return this.tableService.getTableById(userId, tableId);
  }

  // edit table by id
  @Patch(':id')
  editTableById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) tableId: number,
    @Body() dto: EditTableDto,
  ) {
    return this.tableService.editTableById(userId, tableId, dto);
  }

  // delete table by id
  @Delete(':id')
  deleteTableById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) tableId: number,
  ) {
    return this.tableService.deleteTableById(userId, tableId);
  }
}
