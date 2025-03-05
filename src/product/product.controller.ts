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
import { ProductService } from './product.service';
import { GetUser } from 'src/auth/decorator';
import { CreateProductDto, EditProductDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { CategoryExistsPipe, ProductTypeValidPipe } from './pipe';

@UseGuards(JwtGuard)
@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}
  // get product
  @Get()
  getProduct(@GetUser('id') userId: number) {
    return this.productService.getProduct(userId);
  }

  // get product by id
  @Get(':id')
  getProductById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.productService.getProductById(userId, productId);
  }

  // create product
  @Post()
  createProduct(
    @GetUser('id') userId: number,
    @Body(CategoryExistsPipe, ProductTypeValidPipe) dto: CreateProductDto,
  ) {
    return this.productService.createProduct(userId, dto);
  }

  // edit product by id
  @Patch(':id')
  editProductById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Body(CategoryExistsPipe, ProductTypeValidPipe) dto: EditProductDto,
  ) {
    return this.productService.editProductById(userId, productId, dto);
  }

  // delete product by id
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteProductById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.productService.deleteProductById(userId, productId);
  }
}
