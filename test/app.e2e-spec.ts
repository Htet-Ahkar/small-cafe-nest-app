import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
          .stores('userAt', 'access_token')); // pactum's tocken store logic
    });
  });

  describe('User', () => {
    describe('Get User', () => {
      it('should get current user', () => {});
    });

    describe('Edit user', () => {});
  });

  describe('Bookmarks', () => {
    describe('Create bookmark', () => {});

    describe('Get bookmark', () => {});

    describe('Get bookmark by id', () => {});

    describe('Edit bookmark', () => {});

    describe('Delete bookmark by id', () => {});
  });
});
