import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatMessage } from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';

type ChatMessageRow = {
  id: string;
  room_slug: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async getRecentMessages(roomSlug: string): Promise<ChatMessage[]> {
    const result = await this.database.query<ChatMessageRow>(
      `SELECT * FROM room_chat_messages WHERE room_slug = $1 ORDER BY created_at DESC LIMIT 40`,
      [roomSlug],
    );

    return result.rows.reverse().map((row) => this.mapMessage(row));
  }

  async createMessage(userId: string, roomSlug: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new BadRequestException('Message body is required.');
    }

    if (trimmed.length > 280) {
      throw new BadRequestException('Message is too long.');
    }

    const user = await this.usersService.findById(userId);
    const result = await this.database.query<ChatMessageRow>(
      `INSERT INTO room_chat_messages (id, room_slug, user_id, author_name, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), roomSlug, userId, user.username, trimmed],
    );

    return this.mapMessage(result.rows[0]);
  }

  private mapMessage(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      roomSlug: row.room_slug,
      userId: row.user_id,
      authorName: row.author_name,
      body: row.body,
      createdAt: row.created_at,
    };
  }
}
