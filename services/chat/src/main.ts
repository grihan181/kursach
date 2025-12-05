import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',').filter(Boolean);
  if (kafkaBrokers?.length) {
    app.connectMicroservice({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'chat-service',
          brokers: kafkaBrokers,
        },
        consumer: {
          groupId: process.env.KAFKA_CONSUMER_GROUP || 'chat-service-group',
        },
      },
    });
    await app.startAllMicroservices();
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Chat service is running on port ${port}`);
}
bootstrap();
