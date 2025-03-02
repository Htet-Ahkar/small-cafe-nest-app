import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class BaseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
export class CreateCategoryDto extends BaseCategoryDto {}

export class EditCategoryDto extends BaseCategoryDto {}
