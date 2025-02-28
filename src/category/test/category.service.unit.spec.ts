import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  category: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // Get
  describe('Get categories', () => {
    it('should get categories', async () => {
      const userId = 1;
      const categories = [{ id: 1, name: 'Category 1', userId }];
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(
        categories,
      );

      expect(await categoryService.getCategories(userId)).toEqual(categories);
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array if no categories exist', async () => {
      const userId = 1;
      (prismaService.category.findMany as jest.Mock).mockResolvedValue([]);

      expect(await categoryService.getCategories(userId)).toEqual([]);
    });
  });

  // Get by id
  describe('Get category by id', () => {
    it('should get a category by id', async () => {
      const userId = 1,
        categoryId = 1;
      const category = { id: categoryId, name: 'Category 1', userId };
      (prismaService.category.findFirst as jest.Mock).mockResolvedValue(
        category,
      );

      expect(await categoryService.getCategoryById(userId, categoryId)).toEqual(
        category,
      );
      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where: { userId, id: categoryId },
      });
    });

    it('should return null if category does not exist', async () => {
      const userId = 1,
        categoryId = 999;
      (prismaService.category.findFirst as jest.Mock).mockResolvedValue(null);

      expect(
        await categoryService.getCategoryById(userId, categoryId),
      ).toBeNull();
    });
  });

  // Create
  describe('Create category', () => {
    it('should create a category', async () => {
      const userId = 1;
      const dto = { name: 'New Category' };
      const createdCategory = { id: 1, ...dto, userId };
      (prismaService.category.create as jest.Mock).mockResolvedValue(
        createdCategory,
      );

      expect(await categoryService.createCategory(userId, dto)).toEqual(
        createdCategory,
      );
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { userId, ...dto },
      });
    });

    it('should handle creating a category with invalid data', async () => {
      const userId = 1;
      const dto = { name: '' };

      (prismaService.category.create as jest.Mock).mockRejectedValue(
        new Error('Invalid data'),
      );

      await expect(categoryService.createCategory(userId, dto)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  // Edit
  describe('Edit category by id', () => {
    it('should edit a category by id', async () => {
      const userId = 1,
        categoryId = 1;
      const dto = { name: 'Updated Category' };
      const updatedCategory = { id: categoryId, ...dto, userId };
      (prismaService.category.update as jest.Mock).mockResolvedValue(
        updatedCategory,
      );

      expect(
        await categoryService.editCategoryById(userId, categoryId, dto),
      ).toEqual(updatedCategory);
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { userId, id: categoryId },
        data: { ...dto },
      });
    });

    it('should handle editing a non-existent category', async () => {
      const userId = 1,
        categoryId = 999;
      const dto = { name: 'Updated Category' };
      (prismaService.category.update as jest.Mock).mockRejectedValue(
        new Error('Category not found'),
      );

      await expect(
        categoryService.editCategoryById(userId, categoryId, dto),
      ).rejects.toThrow('Category not found');
    });
  });

  // Delete
  describe('Delete category by id', () => {
    it('should delete a category by id', async () => {
      const userId = 1,
        categoryId = 1;
      const deletedCategory = {
        id: categoryId,
        name: 'Deleted Category',
        userId,
      };
      (prismaService.category.delete as jest.Mock).mockResolvedValue(
        deletedCategory,
      );

      expect(
        await categoryService.deleteCategoryById(userId, categoryId),
      ).toEqual(deletedCategory);
      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { userId, id: categoryId },
      });
    });

    it('should handle deleting a non-existent category', async () => {
      const userId = 1,
        categoryId = 999;
      (prismaService.category.delete as jest.Mock).mockRejectedValue(
        new Error('Category not found'),
      );

      await expect(
        categoryService.deleteCategoryById(userId, categoryId),
      ).rejects.toThrow('Category not found');
    });
  });
});
