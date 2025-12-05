import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { NotificationsProducer } from './notifications.producer';
import { OrdersEventsConsumer } from './orders.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    ClientsModule.registerAsync([
      {
        name: 'CHAT_NOTIFICATIONS',
        useFactory: () => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'chat-notifications',
              brokers: process.env.KAFKA_BROKERS?.split(',').filter(Boolean),
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
  ],
  controllers: [ChatController, OrdersEventsConsumer],
  providers: [ChatService, ChatGateway, NotificationsProducer, CreateMessageDto],
})
export class ChatModule {}
