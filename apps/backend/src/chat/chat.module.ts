import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomAccessModule } from '../room-access/room-access.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, UsersModule, RoomAccessModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
