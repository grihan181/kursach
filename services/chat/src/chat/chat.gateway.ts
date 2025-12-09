import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat', path: '/chat/socket.io' })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit() {
    // eslint-disable-next-line no-console
    console.log('Chat gateway initialized');
  }

  handleConnection(client: Socket) {
    const { orderId } = client.handshake.query;
    if (typeof orderId === 'string') {
      client.join(orderId);
    }
    const historyRoom = typeof orderId === 'string' ? orderId : undefined;
    if (historyRoom) {
      this.chatService.getMessages(historyRoom).then((history) => {
        client.emit('history', history);
      });
    }
  }

@SubscribeMessage('join')
  async handleJoin(
    @MessageBody('orderId') orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (orderId) {
      client.join(orderId);
      const history = await this.chatService.getMessages(orderId);
      client.emit('history', history);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: CreateMessageDto) {
    const message = await this.chatService.createMessage(payload);
    this.server.to(payload.orderId).emit('message', message);
    return message;
  }
}
