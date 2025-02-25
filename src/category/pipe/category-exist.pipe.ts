import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryExistsPipe implements PipeTransform {
  constructor(private prismaService: PrismaService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const category = await this.prismaService.category.findUnique({
      where: { id: value.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return value;
  }
}
