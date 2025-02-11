import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

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

    prismaService = app.get(PrismaService);
    prismaService.cleanDb;
  });

  // Teardown Logic
  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    describe('Signup', () => {
      it.todo('Should signup');
    });

    describe('Signin', () => {});
  });
  describe('User', () => {
    describe('Get me', () => {});

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
