import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalculateTaxDto, CreateTaxDto, EditTaxDto } from './dto';
import { TaxCalculatorService } from 'src/app-services';

@Injectable()
export class TaxService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly taxCalculatorService: TaxCalculatorService,
  ) {}

  async createTax(userId: number, dto: CreateTaxDto) {
    const tax = await this.prismaService.tax.create({
      data: { userId, ...dto },
    });

    return tax;
  }

  async getTaxes(userId: number) {
    const tax = await this.prismaService.tax.findMany({
      where: {
        userId,
      },
    });
    return tax;
  }

  async getTaxById(userId: number, taxId: number) {
    const tax = await this.prismaService.tax.findFirst({
      where: { userId, id: taxId },
    });
    return tax;
  }

  async editTaxById(userId: number, taxId: number, dto: EditTaxDto) {
    const tax = await this.prismaService.tax.update({
      where: {
        userId,
        id: taxId,
      },
      data: { ...dto },
    });
    return tax;
  }

  async deleteTaxById(userId: number, taxId: number) {
    const tax = await this.prismaService.tax.delete({
      where: {
        userId,
        id: taxId,
      },
    });
    return tax;
  }

  async calculateTax(dto: CalculateTaxDto) {
    return await this.taxCalculatorService.calculate(dto);
  }
}
