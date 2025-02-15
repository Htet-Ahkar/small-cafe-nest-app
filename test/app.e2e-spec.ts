import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';
import { CreateCategoryDto, EditCategoryDto } from 'src/category/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userAt = 'userAt';
  const token_userAt = `Bearer $S{${userAt}}`;
  const bookmarkId = 'bookmarkId';
  const categoryId = 'categoryId';

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
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: token_userAt,
          })
          .expectStatus(HttpStatus.OK);
      });

      it('should get current user name', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: token_userAt,
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(userName);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'fristName',
        email: 'email@gmail.com',
      };

      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: token_userAt,
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  // bookmark test
  describe('Bookmark', () => {
    const localRoute = '/bookmarks';

    describe('Get empty bookmark', () => {
      it('should get empty bookmark', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const createDto: CreateBookmarkDto = {
        title: 'bookmarkTitle',
        link: 'bookmarkLink',
        // description: 'bookmarkDescription',
      };

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores(bookmarkId, 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${bookmarkId}}`)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(`$S{${bookmarkId}}`);
      });
    });

    describe('Edit bookmark', () => {
      const editDto: EditBookmarkDto = {
        description: 'description',
      };

      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${bookmarkId}}`)
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete(localRoute + '/{id}')
          .withHeaders({ Authorization: token_userAt })
          .withPathParams('id', `$S{${bookmarkId}}`)
          .expectStatus(204);
      });

      it('should get empty bookmark', () => {
        return pactum
          .spec()
          .get(localRoute)
          .withHeaders({ Authorization: token_userAt })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
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
});
