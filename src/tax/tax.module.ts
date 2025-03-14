import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { TaxCalculatorService } from 'src/app-services';

@Module({
  controllers: [TaxController],
  providers: [TaxService, TaxCalculatorService],
})
export class TaxModule {}
