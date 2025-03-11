import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { TaxService } from './tax.service';
import { GetUser } from 'src/auth/decorator';
import { CreateTaxDto, EditTaxDto } from './dto';

@UseGuards(JwtGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // create tax
  @Post()
  createTax(@GetUser('id') userId: number, @Body() dto: CreateTaxDto) {
    return this.taxService.createTax(userId, dto);
  }

  // get taxes
  @Get()
  getTaxes(@GetUser('id') userId: number) {
    return this.taxService.getTaxes(userId);
  }

  // get tax by id
  @Get(':id')
  getTaxById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) taxId: number,
  ) {
    return this.taxService.getTaxById(userId, taxId);
  }

  // edit tax by id
  @Patch(':id')
  editTaxById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) taxId: number,
    @Body() dto: EditTaxDto,
  ) {
    return this.taxService.editTaxById(userId, taxId, dto);
  }

  // delete tax by id
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteTaxById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) taxId: number,
  ) {
    return this.taxService.deleteTaxById(userId, taxId);
  }
}
