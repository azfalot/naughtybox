import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SendChatMessageRequest } from '@naughtybox/shared-types';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';

type AuthedSocket = Socket & {
  data: {
    user?: {
      id: string;
      role: string;
    };
  };
};

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      client.data.user = await this.authService.verifyToken(token);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('chat:join')
  async joinRoom(@ConnectedSocket() client: AuthedSocket, @MessageBody() roomSlug: string) {
    if (!client.data.user || !roomSlug) {
      return;
    }

    await client.join(`room:${roomSlug}`);
    const recent = await this.chatService.getRecentMessages(roomSlug);
    client.emit('chat:history', recent);
  }

  @SubscribeMessage('chat:message')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: SendChatMessageRequest,
  ) {
    if (!client.data.user) {
      return;
    }

    const message = await this.chatService.createMessage(client.data.user.id, payload.roomSlug, payload.body);
    this.server.to(`room:${payload.roomSlug}`).emit('chat:message', message);
  }
}
