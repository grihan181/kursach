import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId/messages')
  async getMessages(@Param('orderId') orderId: string): Promise<Message[]> {
    return this.chatService.getMessages(orderId);
  }
}
