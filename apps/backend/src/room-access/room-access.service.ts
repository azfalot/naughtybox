import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UnlockRoomAccessResponse, ViewerRoomAccess } from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { WalletService } from '../wallet/wallet.service';

type RoomAccessRow = {
  slug: string;
  creator_user_id: string;
  access_mode: 'public' | 'premium' | 'private';
  chat_mode: 'registered' | 'members' | 'tippers';
  private_entry_tokens: number;
  member_monthly_tokens: number;
};

@Injectable()
export class RoomAccessService {
  constructor(
    private readonly database: DatabaseService,
    private readonly walletService: WalletService,
  ) {}

  async getViewerAccess(roomSlug: string, userId: string | null): Promise<ViewerRoomAccess> {
    const room = await this.getRoom(roomSlug);

    const isOwner = userId ? room.creator_user_id === userId : false;
    const isMember = userId ? await this.hasGrant(userId, roomSlug, 'member') : false;
    const hasPrivateAccess = userId ? await this.hasGrant(userId, roomSlug, 'private') : false;
    const isTipper = userId ? await this.hasTipped(userId, roomSlug) : false;

    const canWatch =
      room.access_mode === 'public' ||
      isOwner ||
      isMember ||
      (room.access_mode === 'private' && hasPrivateAccess);

    const canChat =
      isOwner ||
      (room.chat_mode === 'registered' && Boolean(userId) && canWatch) ||
      (room.chat_mode === 'members' && (isMember || hasPrivateAccess)) ||
      (room.chat_mode === 'tippers' && (isMember || hasPrivateAccess || isTipper));

    return {
      accessMode: room.access_mode,
      chatMode: room.chat_mode,
      privateEntryTokens: room.private_entry_tokens,
      memberMonthlyTokens: room.member_monthly_tokens,
      canWatch,
      canChat,
      isMember,
      hasPrivateAccess,
    };
  }

  async unlockPrivate(userId: string, roomSlug: string): Promise<UnlockRoomAccessResponse> {
    const room = await this.getRoom(roomSlug);
    if (room.access_mode === 'public') {
      throw new BadRequestException('This room is public.');
    }

    await this.walletService.chargeForRoomAccess(userId, roomSlug, room.private_entry_tokens, 'Private show access');
    await this.database.query(
      `INSERT INTO room_access_grants (id, user_id, room_slug, grant_type, expires_at)
       VALUES ($1, $2, $3, 'private', NOW() + INTERVAL '24 hours')`,
      [randomUUID(), userId, roomSlug],
    );

    return {
      roomSlug,
      ...(await this.getViewerAccess(roomSlug, userId)),
    };
  }

  async subscribe(userId: string, roomSlug: string): Promise<UnlockRoomAccessResponse> {
    const room = await this.getRoom(roomSlug);

    await this.walletService.chargeForRoomAccess(userId, roomSlug, room.member_monthly_tokens, 'Monthly premium membership');
    await this.database.query(
      `INSERT INTO room_access_grants (id, user_id, room_slug, grant_type, expires_at)
       VALUES ($1, $2, $3, 'member', NOW() + INTERVAL '30 days')`,
      [randomUUID(), userId, roomSlug],
    );

    return {
      roomSlug,
      ...(await this.getViewerAccess(roomSlug, userId)),
    };
  }

  private async getRoom(roomSlug: string) {
    const result = await this.database.query<RoomAccessRow>(
      `
      SELECT
        rooms.slug,
        profiles.user_id AS creator_user_id,
        rooms.access_mode,
        rooms.chat_mode,
        rooms.private_entry_tokens,
        rooms.member_monthly_tokens
      FROM creator_rooms rooms
      INNER JOIN creator_profiles profiles ON profiles.id = rooms.creator_profile_id
      WHERE rooms.slug = $1
      LIMIT 1
      `,
      [roomSlug],
    );

    const room = result.rows[0];
    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return room;
  }

  private async hasGrant(userId: string, roomSlug: string, grantType: 'member' | 'private') {
    const result = await this.database.query(
      `
      SELECT 1
      FROM room_access_grants
      WHERE user_id = $1
        AND room_slug = $2
        AND grant_type = $3
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `,
      [userId, roomSlug, grantType],
    );

    return Boolean(result.rowCount);
  }

  private async hasTipped(userId: string, roomSlug: string) {
    const result = await this.database.query(
      `
      SELECT 1
      FROM token_transactions
      WHERE user_id = $1
        AND room_slug = $2
        AND type = 'tip_sent'
        AND amount < 0
      LIMIT 1
      `,
      [userId, roomSlug],
    );

    return Boolean(result.rowCount);
  }
}
