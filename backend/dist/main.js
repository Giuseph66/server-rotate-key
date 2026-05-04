"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Ollama Pool Gateway')
        .setDescription('Multi-tenant API key rotation gateway for Ollama Cloud')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3333;
    await app.listen(port);
    console.log(`\n🚀 Ollama Pool Gateway running on http://localhost:${port}`);
    console.log(`📖 API Docs: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map