import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.user.deleteMany(),
      this.category.deleteMany(),
      this.product.deleteMany(),
      this.table.deleteMany(),
      this.order.deleteMany(),
      this.orderItem.deleteMany(),
    ]);
  }
}
