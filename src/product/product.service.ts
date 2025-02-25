import { Injectable } from '@nestjs/common';
import { CreateProductDto, EditProductDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  async getProduct(userId: number) {
    const products = await this.prismaService.product.findMany({
      where: {
        userId,
      },
    });

    return products;
  }

  async getProductById(userId: number, productId: number) {
    const product = await this.prismaService.product.findMany({
      where: {
        id: productId,
        userId,
      },
    });

    return product;
  }

  async createProduct(userId: number, dto: CreateProductDto) {
    const product = await this.prismaService.product.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        ...dto,
      },
    });

    return product;
  }

  async editProductById(
    userId: number,
    productId: number,
    dto: EditProductDto,
  ) {
    const product = await this.prismaService.product.update({
      where: {
        id: productId,
        userId,
      },
      data: {
        userId,
        ...dto,
      },
    });

    return product;
  }

  async deleteProductById(userId: number, productId: number) {
    const product = await this.prismaService.product.delete({
      where: {
        id: productId,
        userId,
      },
    });

    return product;
  }
}
