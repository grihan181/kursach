import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'chat',
      password: process.env.DB_PASSWORD || 'chat',
      database: process.env.DB_NAME || 'chat',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
