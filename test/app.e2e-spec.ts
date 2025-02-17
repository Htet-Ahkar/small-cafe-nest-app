import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateCategoryDto, EditCategoryDto } from 'src/category/dto';
import { CreateProductDto, EditProductDto } from 'src/product/dto';
import { BundleItem, ProductType, UnitType } from '@prisma/client';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userAt = 'userAt';
  const token_userAt = `Bearer $S{${userAt}}`;
  const categoryId = 'categoryId';
  const productId = 'productId';

  const userName = 'user';
  const authDto: AuthDto = {
    email: `${userName}@email.com`,
    password: '123',
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
    const testCases = [
      {
        name: 'should throw if email empty',
        body: { password: authDto.password },
        expectedStatus: 400,
      },
      {
        name: 'should throw if password empty',
        body: { email: authDto.email },
        expectedStatus: 400,
      },
      { name: 'should throw if payload empty', body: {}, expectedStatus: 400 },
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
      it('should get bookmark by id', () => {
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

      const editDto_withoutName = {
        description: 'Category Description',
      };

      it('should fail edit category by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${categoryId}}`)
          .withBody(editDto_withoutName)
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
  });

  // product test
  describe('Product', () => {
    const localRoute = '/product';

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

    // TODO
    describe('Create product', () => {
      const createDto_coffee: CreateProductDto = {
        name: 'Coffee',
        unit: UnitType.CUP,
        price: 5,
        trackStock: false,
        stock: 20,
        bundleItems: [],
        type: ProductType.BUNDLE_ITEM,
      };

      const createDto_breakfast: CreateProductDto = {
        name: 'Breakfast Set',
        unit: UnitType.SET,
        price: 15,
        trackStock: false,
        stock: 20,
        bundleItems: [
          {
            productId: 1, // This is coffee id
            quantity: 1,
          },
        ],
        type: ProductType.BUNDLE,
      };

      const createDto_false: CreateProductDto = {
        name: 'Breakfast Set',
        unit: UnitType.SET,
        price: 15,
        trackStock: false,
        stock: 20,
        bundleItems: [], // This shouldn't be empty
        type: ProductType.BUNDLE,
      };

      const createDto_breakfast_false: CreateProductDto = {
        name: 'Breakfast Set 2',
        unit: UnitType.SET,
        price: 15,
        trackStock: false,
        stock: 20,
        bundleItems: [
          {
            productId: 2, // This is breakfast set id
            quantity: 1,
          },
        ],
        type: ProductType.BUNDLE,
      };

      it('should create coffee', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto_coffee)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should not create product ', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto_false)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should create breakfast set', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto_breakfast)
          .stores(productId, 'id')
          .expectStatus(HttpStatus.CREATED);
      });

      it('should not create product set', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto_breakfast_false)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Get products', () => {
      it('should get products', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get product by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${productId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${productId}}`);
      });
    });

    // describe('Edit product', () => {
    //   const editDto: EditProductDto = {
    //     name: 'Pizza',
    //     unit: UnitType.SLICE,
    //     price: 12.34,
    //     trackStock: false,
    //     stock: 30,
    //     bundleItems: [],
    //     type: ProductType.STANDALONE,
    //     description: 'product description',
    //   };

    //   it('should edit product by id', () => {
    //     return pactum
    //       .spec()
    //       .patch(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${productId}}`)
    //       .withBody(editDto)
    //       .expectStatus(HttpStatus.OK)
    //       .expectBodyContains(editDto.description);
    //   });

    //   const editDto_withoutName = {
    //     description: 'Product Description',
    //   };

    //   it('should fail edit product by id', () => {
    //     return pactum
    //       .spec()
    //       .patch(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${productId}}`)
    //       .withBody(editDto_withoutName)
    //       .expectStatus(HttpStatus.BAD_REQUEST);
    //   });
    // });

    // describe('Delete product by id', () => {
    //   it('should delete product by id', () => {
    //     return pactum
    //       .spec()
    //       .delete(localRoute + '/{id}')
    //       .withHeaders({ Authorization: token_userAt })
    //       .withPathParams('id', `$S{${productId}}`)
    //       .expectStatus(HttpStatus.NO_CONTENT);
    //   });

    //   it('should get empty product', () => {
    //     return pactum
    //       .spec()
    //       .get(localRoute)
    //       .withHeaders({ Authorization: token_userAt })
    //       .expectStatus(HttpStatus.OK)
    //       .expectJsonLength(0);
    //   });
    // });
  });
});
