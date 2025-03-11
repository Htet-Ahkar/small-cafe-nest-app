import { Test, TestingModule } from '@nestjs/testing';
import { TaxService } from '../tax.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  tax: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('TaxService', () => {
  let taxService: TaxService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    taxService = module.get<TaxService>(TaxService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(taxService).toBeDefined();
  });

  // Get
  describe('Get taxes', () => {
    it('should get taxes', async () => {
      const userId = 1;
      const taxes = [
        {
          name: 'VAT',
          rate: 7,
          isFixed: false,
          isInclusive: false,
        },
      ];
      mockPrismaService.tax.findMany.mockResolvedValue(taxes);

      expect(await taxService.getTaxes(userId)).toEqual(taxes);
      expect(prismaService.tax.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array if no taxes exist', async () => {
      const userId = 1;
      mockPrismaService.tax.findMany.mockResolvedValue([]);

      expect(await taxService.getTaxes(userId)).toEqual([]);
    });
  });

  // Get by id
  describe('Get tax by id', () => {
    it('should get a tax by id', async () => {
      const userId = 1,
        taxId = 1;
      const tax = {
        id: taxId,
        name: 'VAT',
        rate: 7,
        isFixed: false,
        isInclusive: false,
      };
      mockPrismaService.tax.findFirst.mockResolvedValue(tax);

      expect(await taxService.getTaxById(userId, taxId)).toEqual(tax);
      expect(prismaService.tax.findFirst).toHaveBeenCalledWith({
        where: { userId, id: taxId },
      });
    });

    it('should return null if tax does not exist', async () => {
      const userId = 1,
        taxId = 999;
      mockPrismaService.tax.findFirst.mockResolvedValue(null);

      expect(await taxService.getTaxById(userId, taxId)).toBeNull();
    });
  });

  // Create
  describe('Create tax', () => {
    it('should create a tax', async () => {
      const userId = 1;
      const dto = {
        name: 'VAT',
        rate: 7,
        isFixed: false,
        isInclusive: false,
      };
      const createdTax = { id: 1, ...dto, userId };
      mockPrismaService.tax.create.mockResolvedValue(createdTax);

      expect(await taxService.createTax(userId, dto)).toEqual(createdTax);
      expect(prismaService.tax.create).toHaveBeenCalledWith({
        data: { userId, ...dto },
      });
    });

    it('should handle creating a tax with invalid data', async () => {
      const userId = 1;
      const dto = {
        name: '',
        rate: 7,
        isFixed: false,
        isInclusive: false,
      };

      mockPrismaService.tax.create.mockRejectedValue(new Error('Invalid data'));

      await expect(taxService.createTax(userId, dto)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  // Edit
  describe('Edit tax by id', () => {
    it('should edit a tax by id', async () => {
      const userId = 1,
        taxId = 1;
      const dto = {
        name: 'Update Tax',
        rate: 7,
        isFixed: false,
        isInclusive: false,
      };
      const updatedTable = { id: taxId, ...dto, userId };
      mockPrismaService.tax.update.mockResolvedValue(updatedTable);

      expect(await taxService.editTaxById(userId, taxId, dto)).toEqual(
        updatedTable,
      );
      expect(prismaService.tax.update).toHaveBeenCalledWith({
        where: { userId, id: taxId },
        data: { ...dto },
      });
    });

    it('should handle editing a non-existent tax', async () => {
      const userId = 1,
        taxId = 999;
      const dto = {
        name: 'Update Tax',
        rate: 7,
        isFixed: false,
        isInclusive: false,
      };
      mockPrismaService.tax.update.mockRejectedValue(
        new Error('Table not found'),
      );

      await expect(taxService.editTaxById(userId, taxId, dto)).rejects.toThrow(
        'Table not found',
      );
    });
  });

  // Delete
  describe('Delete tax by id', () => {
    it('should delete a tax by id', async () => {
      const userId = 1,
        taxId = 1;
      const deletedTable = {
        id: taxId,
        name: 'Deleted Table',
        rate: 7,
        isFixed: false,
        isInclusive: false,
        userId,
      };
      mockPrismaService.tax.delete.mockResolvedValue(deletedTable);

      expect(await taxService.deleteTaxById(userId, taxId)).toEqual(
        deletedTable,
      );
      expect(prismaService.tax.delete).toHaveBeenCalledWith({
        where: { userId, id: taxId },
      });
    });

    it('should handle deleting a non-existent tax', async () => {
      const userId = 1,
        taxId = 999;
      mockPrismaService.tax.delete.mockRejectedValue(
        new Error('Table not found'),
      );

      await expect(taxService.deleteTaxById(userId, taxId)).rejects.toThrow(
        'Table not found',
      );
    });
  });
});
