import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    // .addTag('cats')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const options: SwaggerCustomOptions = {
    jsonDocumentUrl: 'swagger/json',
    yamlDocumentUrl: 'swagger/yaml',
  };

  SwaggerModule.setup('swagger', app, documentFactory, options);
  // The factory method SwaggerModule#createDocument() is used specifically to generate the Swagger document when you request it.

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3333);
}

bootstrap();
