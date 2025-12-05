import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { ClientKafka, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Message } from './entities/message.entity';

@Injectable()
export class NotificationsProducer implements OnModuleInit {
  private kafkaClient?: ClientKafka;

  constructor(
    @Optional() @Inject('CHAT_NOTIFICATIONS') kafkaClient?: ClientKafka,
  ) {
    this.kafkaClient = kafkaClient;
  }

  onModuleInit() {
    if (!this.kafkaClient && process.env.KAFKA_BROKERS) {
      this.kafkaClient = ClientProxyFactory.create({
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'chat-notifications-producer',
            brokers: process.env.KAFKA_BROKERS.split(',').filter(Boolean),
          },
          producerOnlyMode: true,
        },
      }) as ClientKafka;
    }
  }

  async notifyNewMessage(message: Message): Promise<void> {
    if (!this.kafkaClient) {
      return;
    }

    await this.kafkaClient.connect();
    await this.kafkaClient.emit('chat.notifications', {
      id: message.id,
      orderId: message.conversation?.orderId ?? message.conversationId,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
    });
  }
}
