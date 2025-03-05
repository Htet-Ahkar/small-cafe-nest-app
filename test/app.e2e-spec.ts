import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateCategoryDto, EditCategoryDto } from 'src/category/dto';
import { ProductType, TableStatus, UnitType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTableDto, EditTableDto } from 'src/table/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userAt = 'userAt';
  const token_userAt = `Bearer $S{${userAt}}`;

  const userName = 'user';

  // Clean up helper function
  enum Model {
    CATEGORY = 'CATEGORY',
    PRODUCT = 'PRODUCT',
    TABLE = 'TABLE',
  }

  const cleanUp = (models: Model[]) => {
    models.forEach(async (model) => {
      switch (model) {
        case Model.CATEGORY:
          await prismaService.category.deleteMany();
          break;

        case Model.PRODUCT:
          await prismaService.product.deleteMany();
          break;

        case Model.TABLE:
          await prismaService.table.deleteMany();
          break;

        default:
          break;
      }
    });
  };

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
      cleanUp([Model.CATEGORY]);
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
      cleanUp([Model.CATEGORY, Model.PRODUCT]);
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
      cleanUp([Model.TABLE]);
    });
  });

  // order test
  describe('Order', () => {
    const localRoute = '/order';
    const orderId = 'orderId';

    // beforeAll(async () => {});

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
      const categoryId_drink = 'categoryId_drink';
      const categoryId_breakfast = 'categoryId_breakfast';

      const productId_coffee = 'productId_coffee';
      const productId_breakfastSet = 'productId_breakfastSet';

      const tableAId = 'tableAId';
      const tableBId = 'tableBId';
      const tableCId = 'tableCId';

      beforeAll(async () => {
        const categoryRoute = '/category',
          productRoute = '/product',
          tableRoute = '/table';

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
      });

      // const createDto: CreateCategoryDto = {
      //   name: 'Category Name',
      //   type: 'Category Type',
      //   // description: 'Category Description',
      // };

      // it('should create category', () => {
      //   return pactum
      //     .spec()
      //     .post(localRoute)
      //     .withHeaders({ Authorization: token_userAt })
      //     .withBody(createDto)
      //     .expectStatus(HttpStatus.CREATED)
      //     .stores(orderId, 'id');
      // });
    });

    // describe('Get categories', () => {
    //   it('should get categories', () => {
    //     return pactum
    //       .spec()
    //       .get(localRoute)
    //       .withHeaders({ Authorization: token_userAt })
    //       .expectStatus(HttpStatus.OK)
    //       .expectJsonLength(1);
    //   });
    // });

    // describe('Get category by id', () => {
    //   it('should get category by id', () => {
    //     return pactum
    //       .spec()
    //       .get(localRoute)
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${orderId}}`)
    //       .expectStatus(HttpStatus.OK)
    //       .expectBodyContains(`$S{${orderId}}`);
    //   });
    // });

    // describe('Edit category', () => {
    //   const editDto: EditCategoryDto = {
    //     name: 'Edited Name',
    //     description: 'Category Description',
    //   };

    //   it('should edit category by id', () => {
    //     return pactum
    //       .spec()
    //       .patch(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${orderId}}`)
    //       .withBody(editDto)
    //       .expectStatus(HttpStatus.OK)
    //       .expectBodyContains(editDto.description);
    //   });

    //   it('should fail edit category by id', () => {
    //     return pactum
    //       .spec()
    //       .patch(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${orderId}}`)
    //       .withBody({
    //         ...editDto,
    //         name: '',
    //       })
    //       .expectStatus(HttpStatus.BAD_REQUEST);
    //   });
    // });

    // describe('Delete category by id', () => {
    //   it('should delete category by id', () => {
    //     return pactum
    //       .spec()
    //       .delete(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${orderId}}`)
    //       .expectStatus(HttpStatus.NO_CONTENT);
    //   });

    //   it('should get empty category', () => {
    //     return pactum
    //       .spec()
    //       .get(localRoute)
    //       .withHeaders({ Authorization: token_userAt })
    //       .expectStatus(HttpStatus.OK)
    //       .expectJsonLength(0);
    //   });
    // });

    afterAll(async () => {
      cleanUp([Model.CATEGORY]);
    });
  });
});
