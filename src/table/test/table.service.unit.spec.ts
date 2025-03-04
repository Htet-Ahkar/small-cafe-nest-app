import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from '../table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TableStatus } from '@prisma/client';

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(tableService).toBeDefined();
  });

  // Get
  describe('Get tables', () => {
    it('should get tables', async () => {
      const userId = 1;
      const tables = [
        {
          tableName: 'Table 1',
          status: TableStatus.AVAILABLE,
          userId,
        },
      ];
      (prismaService.table.findMany as jest.Mock).mockResolvedValue(tables);

      expect(await tableService.getTables(userId)).toEqual(tables);
      expect(prismaService.table.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array if no tables exist', async () => {
      const userId = 1;
      (prismaService.table.findMany as jest.Mock).mockResolvedValue([]);

      expect(await tableService.getTables(userId)).toEqual([]);
    });
  });

  // Get by id
  describe('Get table by id', () => {
    it('should get a table by id', async () => {
      const userId = 1,
        tableId = 1;
      const table = {
        id: tableId,
        name: 'Table 1',
        status: TableStatus.AVAILABLE,
        userId,
      };
      (prismaService.table.findFirst as jest.Mock).mockResolvedValue(table);

      expect(await tableService.getTableById(userId, tableId)).toEqual(table);
      expect(prismaService.table.findFirst).toHaveBeenCalledWith({
        where: { userId, id: tableId },
      });
    });

    it('should return null if table does not exist', async () => {
      const userId = 1,
        tableId = 999;
      (prismaService.table.findFirst as jest.Mock).mockResolvedValue(null);

      expect(await tableService.getTableById(userId, tableId)).toBeNull();
    });
  });

  // Create
  describe('Create table', () => {
    it('should create a table', async () => {
      const userId = 1;
      const dto = { name: 'New Table', status: TableStatus.AVAILABLE };
      const createdCategory = { id: 1, ...dto, userId };
      (prismaService.table.create as jest.Mock).mockResolvedValue(
        createdCategory,
      );

      expect(await tableService.createTable(userId, dto)).toEqual(
        createdCategory,
      );
      expect(prismaService.table.create).toHaveBeenCalledWith({
        data: { userId, ...dto },
      });
    });

    it('should handle creating a table with invalid data', async () => {
      const userId = 1;
      const dto = { name: '', status: TableStatus.AVAILABLE };

      (prismaService.table.create as jest.Mock).mockRejectedValue(
        new Error('Invalid data'),
      );

      await expect(tableService.createTable(userId, dto)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  // Edit
  describe('Edit table by id', () => {
    it('should edit a table by id', async () => {
      const userId = 1,
        tableId = 1;
      const dto = { name: 'update Table', status: TableStatus.AVAILABLE };
      const updatedTable = { id: tableId, ...dto, userId };
      (prismaService.table.update as jest.Mock).mockResolvedValue(updatedTable);

      expect(await tableService.editTableById(userId, tableId, dto)).toEqual(
        updatedTable,
      );
      expect(prismaService.table.update).toHaveBeenCalledWith({
        where: { userId, id: tableId },
        data: { ...dto },
      });
    });

    it('should handle editing a non-existent table', async () => {
      const userId = 1,
        tableId = 999;
      const dto = { name: 'update Table', status: TableStatus.AVAILABLE };
      (prismaService.table.update as jest.Mock).mockRejectedValue(
        new Error('Category not found'),
      );

      await expect(
        tableService.editTableById(userId, tableId, dto),
      ).rejects.toThrow('Category not found');
    });
  });

  // Delete
  describe('Delete table by id', () => {
    it('should delete a table by id', async () => {
      const userId = 1,
        tableId = 1;
      const deletedTable = {
        id: tableId,
        name: 'Deleted Table',
        userId,
      };
      (prismaService.table.delete as jest.Mock).mockResolvedValue(deletedTable);

      expect(await tableService.deleteTableById(userId, tableId)).toEqual(
        deletedTable,
      );
      expect(prismaService.table.delete).toHaveBeenCalledWith({
        where: { userId, id: tableId },
      });
    });

    it('should handle deleting a non-existent table', async () => {
      const userId = 1,
        tableId = 999;
      (prismaService.table.delete as jest.Mock).mockRejectedValue(
        new Error('Table not found'),
      );

      await expect(
        tableService.deleteTableById(userId, tableId),
      ).rejects.toThrow('Table not found');
    });
  });
});
