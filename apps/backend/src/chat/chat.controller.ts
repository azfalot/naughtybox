import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':roomSlug')
  getMessages(@Param('roomSlug') roomSlug: string) {
    return this.chatService.getRecentMessages(roomSlug);
  }
}
