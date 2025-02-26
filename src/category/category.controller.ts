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
import { CategoryService } from './category.service';
import { GetUser } from 'src/auth/decorator';
import { CreateCategoryDto, EditCategoryDto } from './dto';

@UseGuards(JwtGuard)
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  // get categories
  @Get()
  getCategories(@GetUser('id') userId: number) {
    return this.categoryService.getCategories(userId);
  }

  // get category by id
  @Get(':id')
  getCategoryById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
  ) {
    return this.categoryService.getCategoryById(userId, categoryId);
  }

  // create category
  @Post()
  createCategory(
    @GetUser('id') userId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategory(userId, dto);
  }

  // edit category by id
  @Patch(':id')
  editCategoryById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() dto: EditCategoryDto,
  ) {
    return this.categoryService.editCategoryById(userId, categoryId, dto);
  }

  // delete category by id
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteCategoryById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
  ) {
    return this.categoryService.deleteCategoryById(userId, categoryId);
  }
}
