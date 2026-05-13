import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST?.trim();

  if (host) {
    await app.listen(port, host);
  } else {
    // Let Node/Nest choose the default bind address so localhost works on IPv4 and IPv6.
    await app.listen(port);
  }
  logger.log(`API running on http://localhost:${port}`);

  // Graceful shutdown: release port before nodemon restarts the process.
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, closing HTTP server...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
bootstrap();
