import { Injectable } from '@nestjs/common';
import { CreateCategoryDto, EditCategoryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async getCategories(userId: number) {
    const categories = await this.prismaService.category.findMany({
      where: {
        userId,
      },
    });

    return categories;
  }

  async getCategoryById(userId: number, categoryId: number) {
    return await this.prismaService.category.findFirst({
      where: {
        userId,
        id: categoryId,
      },
    });
  }

  async createCategory(userId: number, dto: CreateCategoryDto) {
    return await this.prismaService.category.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async editCategoryById(
    userId: number,
    categoryId: number,
    dto: EditCategoryDto,
  ) {
    return await this.prismaService.category.update({
      where: {
        userId,
        id: categoryId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteCategoryById(userId: number, categoryId: number) {
    return await this.prismaService.category.delete({
      where: {
        userId,
        id: categoryId,
      },
    });
  }
}
