import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userAt = 'userAt';
  const token_userAt = `Bearer $S{${userAt}}`;

  // helper function
  const testEndpoint =
    (endpoint: string) => async (body: object, expectedStatus: number) =>
      await pactum
        .spec()
        .post(endpoint)
        .withBody(body)
        .expectStatus(expectedStatus);

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
      email: 'user@email.com',
      password: '123',
    };

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

    // test singnup logics
    describe('Signup', () => {
      const signupTest = testEndpoint('/auth/signup');

      testCases.forEach(({ name, body, expectedStatus }) => {
        it(name, () => signupTest(body, expectedStatus));
      });

      it('should signup', () =>
        pactum.spec().post('/auth/signup').withBody(authDto).expectStatus(201));
    });

    // test singnin logics
    describe('Signin', () => {
      const signinTest = testEndpoint('/auth/signin');

      testCases.forEach(({ name, body, expectedStatus }) => {
        it(name, () => signinTest(body, expectedStatus));
      });

      it('should signin', () =>
        pactum
          .spec()
          .post('/auth/signin')
          .withBody(authDto)
          .expectStatus(200)
          .stores(userAt, 'access_token')); // pactum's tocken store logic
    });
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: token_userAt,
          })
          .expectStatus(200);
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
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Create bookmark', () => {});

    describe('Get bookmarks', () => {});

    describe('Get bookmark by id', () => {});

    describe('Edit bookmark by id', () => {});

    describe('Delete bookmark by id', () => {});
  });
});
