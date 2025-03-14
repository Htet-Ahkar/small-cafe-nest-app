import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaxCalculatorService {
  constructor(private readonly prismaService: PrismaService) {}

  calculate = async ({
    totalItemPrice,
    taxIds,
  }: {
    totalItemPrice: number;
    taxIds: number[];
  }) => {
    const taxes = await this.prismaService.tax.findMany({
      where: { id: { in: taxIds } },
    });

    const { totalTaxFixed, totalTaxPercentage } = taxes.reduce(
      (acc, { isFixed, rate }) => {
        isFixed
          ? (acc.totalTaxFixed += rate)
          : (acc.totalTaxPercentage += rate);
        return acc;
      },
      { totalTaxFixed: 0, totalTaxPercentage: 0 },
    );

    // Compute subtotal and round to 2 decimals
    const sub_total = parseFloat(
      (totalItemPrice * (1 + totalTaxPercentage / 100) + totalTaxFixed).toFixed(
        2,
      ),
    );

    // Get whole number and decimal part
    const int_part = Math.trunc(sub_total);
    const float_part = parseFloat((sub_total - int_part).toFixed(2));

    // Correct rounding logic
    const rounding = parseFloat(
      (float_part > 0 ? 1 - float_part : 0).toFixed(2),
    );
    const total_price = sub_total + rounding;

    return {
      after_tax_total: total_price,
      rounding,
      before_tax_total: sub_total,
    };
  };
}
