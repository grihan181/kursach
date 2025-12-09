import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId/messages')
  async getMessages(@Param('orderId') orderId: string): Promise<Message[]> {
    return this.chatService.getMessages(orderId);
  }

  @Get()
  async listConversations(): Promise<Array<{ orderId: string; lastMessageAt: string | null }>> {
    return this.chatService.getConversationSummaries();
  }

  @Post(':orderId/messages')
  async postMessage(
    @Param('orderId') orderId: string,
    @Body() body: { sender: string; content: string },
  ): Promise<Message> {
    const payload: CreateMessageDto = { ...body, orderId };
    return this.chatService.createMessage(payload);
  }
}
