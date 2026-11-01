import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OpenChair API')
    .setDescription(
      'Appointment booking platform for salons and barbershops',
    )
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(
    app as any,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'swagger',
    app as any,
    document,
  );

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(
    `OpenChair API running on http://localhost:${port}`,
  );

  console.log(
    `Swagger running on http://localhost:${port}/swagger`,
  );
}

await bootstrap();