import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { NotificationsProducer } from './notifications.producer';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly notificationsProducer: NotificationsProducer,
  ) {}

  async getConversation(orderId: string): Promise<Conversation | null> {
    return this.conversationsRepository.findOne({
      where: { orderId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async getMessages(orderId: string): Promise<Message[]> {
    const conversation = await this.getConversation(orderId);
    if (!conversation) {
      return [];
    }
    return conversation.messages ?? [];
  }

  async createMessage(dto: CreateMessageDto): Promise<Message> {
    const conversation =
      (await this.getConversation(dto.orderId)) ??
      this.conversationsRepository.create({ orderId: dto.orderId });

    await this.conversationsRepository.save(conversation);

    const message = this.messagesRepository.create({
      content: dto.content,
      sender: dto.sender,
      conversation,
    });
    const saved = await this.messagesRepository.save(message);

    await this.notificationsProducer.notifyNewMessage(saved).catch((err) => {
      this.logger.error('Failed to send Kafka notification', err);
    });

    return saved;
  }
}
