import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from '../table.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  table: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('TableService', () => {
  let tableService: TableService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    tableService = module.get<TableService>(TableService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(tableService).toBeDefined();
  });

  // Get
  // describe('Get tables', () => {
  //   it('should get tables', async () => {
  //     const userId = 1;
  //     const tables = [{ id: 1, name: 'Table 1', userId }];
  //     (prismaService.table.findMany as jest.Mock).mockResolvedValue(
  //       tables,
  //     );

  //     expect(await tableService.getTables(userId)).toEqual(tables);
  //     expect(prismaService.table.findMany).toHaveBeenCalledWith({
  //       where: { userId },
  //     });
  //   });

  //   it('should return an empty array if no tables exist', async () => {
  //     const userId = 1;
  //     (prismaService.table.findMany as jest.Mock).mockResolvedValue([]);

  //     expect(await tableService.getTables(userId)).toEqual([]);
  //   });
  // });

  // // Get by id
  // describe('Get table by id', () => {
  //   it('should get a table by id', async () => {
  //     const userId = 1,
  //       categoryId = 1;
  //     const table = { id: categoryId, name: 'Category 1', userId };
  //     (prismaService.table.findFirst as jest.Mock).mockResolvedValue(
  //       table,
  //     );

  //     expect(await tableService.getCategoryById(userId, categoryId)).toEqual(
  //       table,
  //     );
  //     expect(prismaService.table.findFirst).toHaveBeenCalledWith({
  //       where: { userId, id: categoryId },
  //     });
  //   });

  //   it('should return null if table does not exist', async () => {
  //     const userId = 1,
  //       categoryId = 999;
  //     (prismaService.table.findFirst as jest.Mock).mockResolvedValue(null);

  //     expect(
  //       await tableService.getCategoryById(userId, categoryId),
  //     ).toBeNull();
  //   });
  // });

  // // Create
  // describe('Create table', () => {
  //   it('should create a table', async () => {
  //     const userId = 1;
  //     const dto = { name: 'New Category' };
  //     const createdCategory = { id: 1, ...dto, userId };
  //     (prismaService.table.create as jest.Mock).mockResolvedValue(
  //       createdCategory,
  //     );

  //     expect(await tableService.createCategory(userId, dto)).toEqual(
  //       createdCategory,
  //     );
  //     expect(prismaService.table.create).toHaveBeenCalledWith({
  //       data: { userId, ...dto },
  //     });
  //   });

  //   it('should handle creating a table with invalid data', async () => {
  //     const userId = 1;
  //     const dto = { name: '' };

  //     (prismaService.table.create as jest.Mock).mockRejectedValue(
  //       new Error('Invalid data'),
  //     );

  //     await expect(tableService.createCategory(userId, dto)).rejects.toThrow(
  //       'Invalid data',
  //     );
  //   });
  // });

  // // Edit
  // describe('Edit table by id', () => {
  //   it('should edit a table by id', async () => {
  //     const userId = 1,
  //       categoryId = 1;
  //     const dto = { name: 'Updated Category' };
  //     const updatedCategory = { id: categoryId, ...dto, userId };
  //     (prismaService.table.update as jest.Mock).mockResolvedValue(
  //       updatedCategory,
  //     );

  //     expect(
  //       await tableService.editCategoryById(userId, categoryId, dto),
  //     ).toEqual(updatedCategory);
  //     expect(prismaService.table.update).toHaveBeenCalledWith({
  //       where: { userId, id: categoryId },
  //       data: { ...dto },
  //     });
  //   });

  //   it('should handle editing a non-existent table', async () => {
  //     const userId = 1,
  //       categoryId = 999;
  //     const dto = { name: 'Updated Category' };
  //     (prismaService.table.update as jest.Mock).mockRejectedValue(
  //       new Error('Category not found'),
  //     );

  //     await expect(
  //       tableService.editCategoryById(userId, categoryId, dto),
  //     ).rejects.toThrow('Category not found');
  //   });
  // });

  // // Delete
  // describe('Delete table by id', () => {
  //   it('should delete a table by id', async () => {
  //     const userId = 1,
  //       categoryId = 1;
  //     const deletedCategory = {
  //       id: categoryId,
  //       name: 'Deleted Category',
  //       userId,
  //     };
  //     (prismaService.table.delete as jest.Mock).mockResolvedValue(
  //       deletedCategory,
  //     );

  //     expect(
  //       await tableService.deleteCategoryById(userId, categoryId),
  //     ).toEqual(deletedCategory);
  //     expect(prismaService.table.delete).toHaveBeenCalledWith({
  //       where: { userId, id: categoryId },
  //     });
  //   });

  //   it('should handle deleting a non-existent table', async () => {
  //     const userId = 1,
  //       categoryId = 999;
  //     (prismaService.table.delete as jest.Mock).mockRejectedValue(
  //       new Error('Category not found'),
  //     );

  //     await expect(
  //       tableService.deleteCategoryById(userId, categoryId),
  //     ).rejects.toThrow('Category not found');
  //   });
  // });
});
