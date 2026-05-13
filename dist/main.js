"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableShutdownHooks();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors();
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST?.trim();
    if (host) {
        await app.listen(port, host);
    }
    else {
        await app.listen(port);
    }
    logger.log(`API running on http://localhost:${port}`);
    const shutdown = async (signal) => {
        logger.log(`Received ${signal}, closing HTTP server...`);
        await app.close();
        process.exit(0);
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
}
bootstrap();
//# sourceMappingURL=main.js.map