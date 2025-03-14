import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateCategoryDto, EditCategoryDto } from 'src/category/dto';
import {
  OrderType,
  PaymentMethod,
  ProductType,
  TableStatus,
  UnitType,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTableDto, EditTableDto } from 'src/table/dto';
import { CreateOrderDto, EditOrderDto } from 'src/order/dto';
import { CreateTaxDto, EditTaxDto } from 'src/tax/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userAt = 'userAt';
  const token_userAt = `Bearer $S{${userAt}}`;

  const userName = 'user';

  // Starting Logic
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
    await app.listen(3333);

    prismaService = app.get(PrismaService);
    await prismaService.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  // Teardown Logic
  afterAll(async () => {
    await app.close();
  });

  // auth test
  describe('Auth', () => {
    const authDto: AuthDto = {
      email: `${userName}@email.com`,
      password: '123',
    };

    const testCases = [
      {
        name: 'should throw if email empty',
        body: { password: authDto.password },
        expectedStatus: HttpStatus.BAD_REQUEST,
      },
      {
        name: 'should throw if password empty',
        body: { email: authDto.email },
        expectedStatus: HttpStatus.BAD_REQUEST,
      },
      {
        name: 'should throw if payload empty',
        body: {},
        expectedStatus: HttpStatus.BAD_REQUEST,
      },
    ];

    // helper function
    const testEndpoint =
      (endpoint: string) => async (body: object, expectedStatus: number) =>
        await pactum
          .spec()
          .post(endpoint)
          .withBody(body)
          .expectStatus(expectedStatus);

    // test singnup logics
    describe('Signup', () => {
      const localRoute = '/auth/signup';

      const signupTest = testEndpoint(localRoute);

      testCases.forEach(({ name, body, expectedStatus }) => {
        it(name, () => signupTest(body, expectedStatus));
      });

      it('should signup', () =>
        pactum
          .spec()
          .post(localRoute)
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED));
    });

    // test singnin logics
    describe('Signin', () => {
      const localRoute = '/auth/signin';

      const signinTest = testEndpoint(localRoute);

      testCases.forEach(({ name, body, expectedStatus }) => {
        it(name, () => signinTest(body, expectedStatus));
      });

      it('should signin', () =>
        pactum
          .spec()
          .post(localRoute)
          .withBody(authDto)
          .expectStatus(HttpStatus.OK)
          .stores(userAt, 'access_token')); // pactum's token store logic
    });
  });

  // user test
  describe('User', () => {
    describe('Get Me', () => {
      const localRoute = '/users/current';

      it('should get current user', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({
            Authorization: token_userAt,
          })
          .expectStatus(HttpStatus.OK);
      });

      it('should get current user name', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({
            Authorization: token_userAt,
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(userName);
      });
    });

    describe('Edit user', () => {
      const localRoute = '/users';

      const dto: EditUserDto = {
        email: 'user@gmail.com',
        userName: 'user',
        firstName: 'fristName',
        isAavilable: true,
      };

      it('should edit user', () => {
        return pactum
          .spec()
          .patch(localRoute)
          .withHeaders({
            Authorization: token_userAt,
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.userName)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.isAavilable);
      });

      const dto_false = {
        firstName: 'fristName',
        lastName: 'lastName',
      };

      it('should fail edit user', () => {
        return pactum
          .spec()
          .patch(localRoute)
          .withHeaders({
            Authorization: token_userAt,
          })
          .withBody(dto_false)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });
  });

  // category test
  describe('Category', () => {
    const localRoute = '/category';

    const categoryId = 'categoryId';

    describe('Get empty category', () => {
      it('should get empty category', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create category', () => {
      const createDto: CreateCategoryDto = {
        name: 'Category Name',
        type: 'Category Type',
        // description: 'Category Description',
      };

      it('should create category', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores(categoryId, 'id');
      });
    });

    describe('Get categories', () => {
      it('should get categories', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get category by id', () => {
      it('should get category by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${categoryId}}`);
      });
    });

    describe('Edit category', () => {
      const editDto: EditCategoryDto = {
        name: 'Edited Name',
        description: 'Category Description',
      };

      it('should edit category by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId}}`)
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description);
      });

      it('should fail edit category by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId}}`)
          .withBody({
            ...editDto,
            name: '',
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Delete category by id', () => {
      it('should delete category by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty category', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });

    afterAll(async () => {
      prismaService.$transaction([prismaService.category.deleteMany()]);
    });
  });

  // product test
  describe('Product', () => {
    const localRoute = '/product';

    const categoryId_drink = 'categoryId_drink';
    const categoryId_breakfast = 'categoryId_breakfast';

    const productId_coffee = 'productId_coffee';
    const productId_breakfastSet = 'productId_breakfastSet';

    describe('Get empty product', () => {
      it('should get empty product', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create product', () => {
      beforeAll(async () => {
        const localRoute = '/category';

        const drinkResponse = await pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'Drink',
            type: 'drink',
          })
          .stores(categoryId_drink, 'id')
          .expectStatus(HttpStatus.CREATED);

        const breakfastResponse = await pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'breakfast',
            type: 'set',
          })
          .stores(categoryId_breakfast, 'id')
          .expectStatus(HttpStatus.CREATED);
      });

      it('should fail create coffee ', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_drink}}`,
            name: 'Coffee',
            unit: UnitType.CUP,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: '[]', // If type is bundle, this should not be empty.
            type: ProductType.BUNDLE, // This should not be bundle.
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should create coffee', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_drink}}`,
            name: 'Coffee',
            unit: UnitType.CUP,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: '[]',
            type: ProductType.BUNDLE_ITEM,
          })
          .stores(productId_coffee, 'id')
          .expectStatus(HttpStatus.CREATED);
      });

      it('should fail create breakfast set', () => {
        const bundleItems = [
          {
            productId: Number(pactum.stash.getDataStore(productId_coffee)),
            quantity: 1,
          },
        ];

        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_breakfast}}`,
            name: 'Breakfast set',
            unit: UnitType.SET,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: JSON.stringify(bundleItems),
            type: ProductType.STANDALONE,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should create breakfast set', () => {
        const bundleItems = [
          {
            productId: Number(pactum.stash.getDataStore(productId_coffee)),
            quantity: 1,
          },
        ];

        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_breakfast}}`,
            name: 'Breakfast set',
            unit: UnitType.SET,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: JSON.stringify(bundleItems),
            type: ProductType.BUNDLE,
          })
          .stores(productId_breakfastSet, 'id')
          .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('Get products', () => {
      it('should get products', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(2);
      });
    });

    describe('Get product by id', () => {
      it('should get product by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${productId_breakfastSet}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${productId_breakfastSet}}`);
      });
    });

    describe('Edit product', () => {
      it('should edit product by id', () => {
        const bundleItems = [
          {
            productId: Number(pactum.stash.getDataStore(productId_coffee)),
            quantity: 10,
          },
        ];

        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${productId_breakfastSet}}`)
          .withBody({
            categoryId: `$S{${categoryId_breakfast}}`,
            name: 'Breakfast set edit',
            unit: UnitType.SET,
            price: 10,
            trackStock: false,
            stock: 20,
            bundleItems: JSON.stringify(bundleItems),
            type: ProductType.BUNDLE,
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('Breakfast set edit');
      });

      it('should fail edit product by id', () => {
        const bundleItems = [
          {
            productId: Number(pactum.stash.getDataStore(productId_coffee)),
            quantity: '10', // Should be number
          },
        ];

        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${productId_breakfastSet}}`)
          .withBody({
            categoryId: `$S{${categoryId_breakfast}}`,
            name: 'Breakfast set edit',
            unit: UnitType.SET,
            price: 10,
            trackStock: false,
            stock: 20,
            bundleItems: JSON.stringify(bundleItems),
            type: ProductType.BUNDLE,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Delete product by id', () => {
      it('should delete coffee by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${productId_coffee}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should delete breakfast set by deleting category set', () => {
        return pactum
          .spec()
          .delete('/category' + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId_breakfast}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty product', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });

    afterAll(async () => {
      prismaService.$transaction([
        prismaService.category.deleteMany(),
        prismaService.product.deleteMany(),
      ]);
    });
  });

  // tax test
  describe('Tax', () => {
    const localRoute = '/tax';
    const taxId = 'taxId';

    describe('Get empty tax', () => {
      it('should get empty tax', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create tax', () => {
      const createDto: CreateTaxDto = {
        name: 'New Tax',
        rate: 7,
        isFixed: false,
        isInclusive: false,
        // description: 'Tax Description',
      };

      it('should create tax', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores(taxId, 'id');
      });
    });

    describe('Get taxes', () => {
      it('should get taxes', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get tax by id', () => {
      it('should get tax by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${taxId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${taxId}}`);
      });
    });

    describe('Edit tax', () => {
      const editDto: EditTaxDto = {
        name: 'Edit Tax',
        rate: 7,
        isFixed: false,
        isInclusive: false,
        description: 'Tax Description',
      };

      it('should edit tax by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${taxId}}`)
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description);
      });

      it('should fail edit tax by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${taxId}}`)
          .withBody({
            ...editDto,
            name: '',
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Delete tax by id', () => {
      it('should delete tax by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${taxId}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty tax', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });

    afterAll(async () => {
      prismaService.$transaction([prismaService.tax.deleteMany()]);
    });
  });

  // table test
  describe('Table', () => {
    const localRoute = '/table';
    const tableId = 'tableId';

    describe('Get empty table', () => {
      it('should get empty table', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create table', () => {
      const createDto: CreateTableDto = {
        name: 'Table Name',
        status: TableStatus.AVAILABLE,
        // description: 'Table Description',
      };

      it('should create table', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores(tableId, 'id');
      });
    });

    describe('Get tables', () => {
      it('should get tables', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get table by id', () => {
      it('should get table by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${tableId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${tableId}}`);
      });
    });

    describe('Edit table', () => {
      const editDto: EditTableDto = {
        name: 'Edited Name',
        status: TableStatus.OCCUPIED,
        description: 'Table Description',
      };

      it('should edit table by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${tableId}}`)
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description);
      });

      it('should fail edit table by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${tableId}}`)
          .withBody({
            ...editDto,
            name: '',
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Delete table by id', () => {
      it('should delete table by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${tableId}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty table', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });

    afterAll(async () => {
      prismaService.$transaction([
        prismaService.category.deleteMany(),
        prismaService.product.deleteMany(),
        prismaService.table.deleteMany(),
      ]);
    });
  });

  // order test
  describe('Order', () => {
    const localRoute = '/order';
    const orderId = 'orderId';

    let product_id_coffee: number;
    let product_id_breakfast_set: number;

    let table_id_a: number; // init value available
    let table_id_b: number; // init value occupied
    let table_id_c: number; // init value reserved

    beforeAll(async () => {
      const categoryRoute = '/category',
        productRoute = '/product',
        tableRoute = '/table';

      const categoryId_drink = 'categoryId_drink';
      const categoryId_breakfast = 'categoryId_breakfast';

      const productId_coffee = 'productId_coffee';
      const productId_breakfastSet = 'productId_breakfastSet';

      const tableAId = 'tableAId'; // available
      const tableBId = 'tableBId'; // occupied
      const tableCId = 'tableCId'; // reserved

      // category create
      const drinkCategoryResponse = await pactum
          .spec()
          .post(categoryRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'Drink',
            type: 'drink',
          })
          .stores(categoryId_drink, 'id')
          .expectStatus(HttpStatus.CREATED),
        breakfastCategoryResponse = await pactum
          .spec()
          .post(categoryRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'breakfast',
            type: 'set',
          })
          .stores(categoryId_breakfast, 'id')
          .expectStatus(HttpStatus.CREATED),
        // product create
        coffeeProductResponse = await pactum
          .spec()
          .post(productRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_drink}}`,
            name: 'Coffee',
            unit: UnitType.CUP,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: '[]',
            type: ProductType.BUNDLE_ITEM,
          })
          .stores(productId_coffee, 'id')
          .expectStatus(HttpStatus.CREATED),
        bundleItems = [
          {
            productId: Number(pactum.stash.getDataStore(productId_coffee)),
            quantity: 1,
          },
        ],
        breakfastSetProductResponse = await pactum
          .spec()
          .post(productRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            categoryId: `$S{${categoryId_breakfast}}`,
            name: 'Breakfast set',
            unit: UnitType.SET,
            price: 5,
            trackStock: false,
            stock: 20,
            bundleItems: JSON.stringify(bundleItems),
            type: ProductType.BUNDLE,
          })
          .stores(productId_breakfastSet, 'id')
          .expectStatus(HttpStatus.CREATED),
        // table create
        tableAResponse = await pactum
          .spec()
          .post(tableRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'Table A',
            status: TableStatus.AVAILABLE,
          })
          .expectStatus(HttpStatus.CREATED)
          .stores(tableAId, 'id'),
        tableBResponse = await pactum
          .spec()
          .post(tableRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'Table B',
            status: TableStatus.OCCUPIED,
          })
          .expectStatus(HttpStatus.CREATED)
          .stores(tableBId, 'id'),
        tableCResponse = await pactum
          .spec()
          .post(tableRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody({
            name: 'Table C',
            status: TableStatus.RESERVED,
          })
          .expectStatus(HttpStatus.CREATED)
          .stores(tableCId, 'id');

      product_id_coffee = coffeeProductResponse.body.id;
      product_id_breakfast_set = breakfastSetProductResponse.body.id;

      table_id_a = tableAResponse.body.id;
      table_id_b = tableBResponse.body.id;
      table_id_c = tableCResponse.body.id;
    });

    describe('Get empty order', () => {
      it('should get empty order', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create order', () => {
      describe('Edge cases with tables', () => {
        it('should handle order if table is not found', () => {
          const createDto: CreateOrderDto = {
            tableId: 99,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 5,
              },
            ],
          };

          return pactum
            .spec()
            .post(localRoute)
            .withHeaders({ Authorization: token_userAt })
            .withBody(createDto)
            .expectStatus(HttpStatus.NOT_FOUND);
        });

        it('should handle order if table is not available', () => {
          const createDto: CreateOrderDto = {
            tableId: table_id_b,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 5,
              },
            ],
          };

          return pactum
            .spec()
            .post(localRoute)
            .withHeaders({ Authorization: token_userAt })
            .withBody(createDto)
            .expectStatus(HttpStatus.CONFLICT);
        });
      });

      describe('Edge cases with order items', () => {
        it('should handle order if order item is not found', () => {
          const createDto: CreateOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: 999,
                quantity: 1,
                price: 5,
              },
            ],
          };

          return pactum
            .spec()
            .post(localRoute)
            .withHeaders({ Authorization: token_userAt })
            .withBody(createDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });

        it('should handle order if duplicate order item is found', () => {
          const createDto: CreateOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
            ],
          };

          return pactum
            .spec()
            .post(localRoute)
            .withHeaders({ Authorization: token_userAt })
            .withBody(createDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });

        it('should handle order if order item price do not match', () => {
          const createDto: CreateOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 10,
              },
            ],
          };

          return pactum
            .spec()
            .post(localRoute)
            .withHeaders({ Authorization: token_userAt })
            .withBody(createDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });
      });

      it('should create order', () => {
        const createDto: CreateOrderDto = {
          tableId: table_id_a,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          rounding: 0.5, // !
          taxIds: [1], // !
          subtotal: 10.01, // price aren't match
          totalPrice: 10.01, // price aren't match
          orderItems: [
            {
              productId: product_id_coffee,
              quantity: 1,
              price: 5,
            },
            {
              productId: product_id_breakfast_set,
              quantity: 1,
              price: 5,
            },
          ],
        };

        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores(orderId, 'id');
      });

      describe('Check table status', () => {
        it('after order is created, table status should change to OCCUPIED', () => {
          return pactum
            .spec()
            .get('/table')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', table_id_a)
            .expectStatus(HttpStatus.OK)
            .expectBodyContains(TableStatus.OCCUPIED);
        });
      });

      it('should handle order if orderItems is empty', () => {
        const createDto: CreateOrderDto = {
          tableId: table_id_a,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          rounding: 0.5, // !
          taxIds: [1], // !
          subtotal: 10.01, // price aren't match
          totalPrice: 10.01, // price aren't match
          orderItems: [],
        };

        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Get orders', () => {
      it('should get orders', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get order by id', () => {
      it('should get order by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${orderId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${orderId}}`);
      });
    });

    describe('Edit order', () => {
      describe('Edge cases with tables', () => {
        it('should handle order if table is not found', () => {
          const editDto: EditOrderDto = {
            tableId: 99,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 5,
              },
            ],
            description: 'edit',
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.NOT_FOUND);
        });

        it('should handle order if table is not available', () => {
          const editDto: EditOrderDto = {
            tableId: table_id_b,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 5,
              },
            ],
            description: 'edit',
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.CONFLICT);
        });
      });

      describe('Edge cases with order items', () => {
        it('should handle order if order item is not found', () => {
          const editDto: EditOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: 999,
                quantity: 1,
                price: 5,
              },
            ],
            description: 'edit',
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });

        it('should handle order if duplicate order item is found', () => {
          const editDto: EditOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
            ],
            description: 'edit',
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });

        it('should handle order if order item price do not match', () => {
          const editDto: EditOrderDto = {
            tableId: table_id_a,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 10,
              },
            ],
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.FORBIDDEN);
        });
      });

      it('should edit order by id', () => {
        const editDto: EditOrderDto = {
          tableId: table_id_a,
          type: OrderType.POSTPAID,
          paymentMethod: PaymentMethod.CASH,
          rounding: 0.5, // !
          taxIds: [1], // !
          subtotal: 10.01, // price aren't match
          totalPrice: 10.01, // price aren't match
          orderItems: [
            {
              productId: product_id_coffee,
              quantity: 1,
              price: 5,
            },
            {
              productId: product_id_breakfast_set,
              quantity: 1,
              price: 5,
            },
          ],
          description: 'edit',
        };

        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${orderId}}`)
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description);
      });

      describe('Move table', () => {
        it('should move if table is available', () => {
          const editDto: EditOrderDto = {
            tableId: table_id_c,
            type: OrderType.POSTPAID,
            paymentMethod: PaymentMethod.CASH,
            rounding: 0.5, // !
            taxIds: [1], // !
            subtotal: 10.01, // price aren't match
            totalPrice: 10.01, // price aren't match
            orderItems: [
              {
                productId: product_id_coffee,
                quantity: 1,
                price: 5,
              },
              {
                productId: product_id_breakfast_set,
                quantity: 1,
                price: 5,
              },
            ],
            description: 'edit',
          };

          return pactum
            .spec()
            .patch(localRoute + '/{id}')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', `$S{${orderId}}`)
            .withBody(editDto)
            .expectStatus(HttpStatus.OK)
            .expectBodyContains(editDto.tableId);
        });

        it('after move old table status change to AVAILABLE', () => {
          return pactum
            .spec()
            .get('/table')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', table_id_a)
            .expectStatus(HttpStatus.OK)
            .expectBodyContains(TableStatus.AVAILABLE);
        });

        it('after move new table status change to OCCUPIED', () => {
          return pactum
            .spec()
            .get('/table')
            .withHeaders({ Authorization: token_userAt })
            .withPathParams('id', table_id_c)
            .expectStatus(HttpStatus.OK)
            .expectBodyContains(TableStatus.OCCUPIED);
        });
      });
    });

    describe('Delete order by id', () => {
      it('should delete category by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${orderId}}`)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty order', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });

    afterAll(async () => {
      prismaService.$transaction([
        prismaService.category.deleteMany(),
        prismaService.product.deleteMany(),
        prismaService.table.deleteMany(),
        prismaService.order.deleteMany(),
        prismaService.orderItem.deleteMany(),
      ]);
    });
  });
});
