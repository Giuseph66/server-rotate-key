import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Ollama Pool Gateway')
    .setDescription(
      'Multi-tenant API key rotation gateway for Ollama Cloud.\n\n' +
      '### Authentication\n' +
      'Most endpoints require a **Bearer Token**. You can use either:\n' +
      '1. A **JWT Token** obtained via `/api/auth/login` (for web UI use).\n' +
      '2. A **System API Key** generated in your Profile (for programmatic API use).\n\n' +
      'Pass the token in the `Authorization` header: `Authorization: Bearer <your_token_or_key>`',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(`\n🚀 Ollama Pool Gateway running on http://localhost:${port}`);
  console.log(`📖 API Docs: http://localhost:${port}/docs`);
}
bootstrap();
