import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreatorDashboard,
  CreatorProfile,
  CreatorRoom,
  UpsertCreatorProfileRequest,
  UpsertCreatorRoomRequest,
} from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { StreamsService } from '../streams/streams.service';
import { UsersService } from '../users/users.service';

type CreatorProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  tags: string[];
  age: number | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  interested_in: string | null;
  relationship_status: string | null;
  body_type: string | null;
  languages: string[];
  categories: string[];
  subcategories: string[];
  instagram_url: string | null;
  x_url: string | null;
  onlyfans_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

type CreatorRoomRow = {
  id: string;
  creator_profile_id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  stream_key: string;
  is_public: boolean;
  access_mode: 'public' | 'premium' | 'private';
  chat_mode: 'registered' | 'members' | 'tippers';
  private_entry_tokens: number;
  member_monthly_tokens: number;
  created_at: string;
  updated_at: string;
};

type StreamSessionRow = {
  id: string;
  room_slug: string;
  status: 'preparing' | 'live' | 'ended';
  source: 'browser' | 'obs' | 'system';
  started_at: string;
  ended_at: string | null;
};

@Injectable()
export class CreatorService {
  constructor(
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
    private readonly streamsService: StreamsService,
  ) {}

  async getDashboard(userId: string): Promise<CreatorDashboard> {
    const user = await this.usersService.findById(userId);
    const profile = await this.findProfileByUserId(userId);
    const room = profile ? await this.findRoomByProfileId(profile.id) : null;
    const stream = room ? await this.streamsService.getStream(room.slug) : null;

    return { user, profile, room, stream };
  }

  async upsertProfile(userId: string, payload: UpsertCreatorProfileRequest) {
    if (!payload.displayName?.trim() || !payload.slug?.trim()) {
      throw new BadRequestException('Display name and slug are required.');
    }

    const normalizedSlug = this.normalizeSlug(payload.slug);
    const tags = this.normalizeTags(payload.tags);
    const languages = this.normalizeTags(payload.languages);
    const categories = this.normalizeTags(payload.categories);
    const subcategories = this.normalizeTags(payload.subcategories);
    const existing = await this.findProfileByUserId(userId);

    const values = [
      userId,
      payload.displayName.trim(),
      normalizedSlug,
      payload.bio?.trim() ?? '',
      payload.avatarUrl?.trim() || null,
      payload.coverImageUrl?.trim() || null,
      payload.accentColor?.trim() || null,
      tags,
      payload.age ?? null,
      payload.gender?.trim() || null,
      payload.country?.trim() || null,
      payload.city?.trim() || null,
      payload.interestedIn?.trim() || null,
      payload.relationshipStatus?.trim() || null,
      payload.bodyType?.trim() || null,
      languages,
      categories,
      subcategories,
      payload.instagramUrl?.trim() || null,
      payload.xUrl?.trim() || null,
      payload.onlyFansUrl?.trim() || null,
      payload.websiteUrl?.trim() || null,
    ];

    if (existing) {
      const result = await this.database.query<CreatorProfileRow>(
        `UPDATE creator_profiles
         SET display_name = $2,
             slug = $3,
             bio = $4,
             avatar_url = $5,
             cover_image_url = $6,
             accent_color = $7,
             tags = $8,
             age = $9,
             gender = $10,
             country = $11,
             city = $12,
             interested_in = $13,
             relationship_status = $14,
             body_type = $15,
             languages = $16,
             categories = $17,
             subcategories = $18,
             instagram_url = $19,
             x_url = $20,
             onlyfans_url = $21,
             website_url = $22,
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        values,
      );

      await this.syncRoomSlug(existing.id, normalizedSlug);
      await this.usersService.setRole(userId, 'creator');
      return this.mapProfile(result.rows[0]);
    }

    const result = await this.database.query<CreatorProfileRow>(
      `INSERT INTO creator_profiles (
         id, user_id, display_name, slug, bio, avatar_url, cover_image_url, accent_color, tags,
         age, gender, country, city, interested_in, relationship_status, body_type,
         languages, categories, subcategories, instagram_url, x_url, onlyfans_url, website_url
       )
       VALUES (
         $23, $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, $21, $22
       )
       RETURNING *`,
        [randomUUID(), ...values],
      );

    await this.usersService.setRole(userId, 'creator');
    return this.mapProfile(result.rows[0]);
  }

  async upsertRoom(userId: string, payload: UpsertCreatorRoomRequest) {
    const profile = await this.findProfileByUserId(userId);
    if (!profile) {
      throw new BadRequestException('Create your creator profile before configuring the room.');
    }

    if (!payload.title?.trim()) {
      throw new BadRequestException('Room title is required.');
    }

    const tags = this.normalizeTags(payload.tags) ?? profile.tags;
    const existing = await this.findRoomByProfileId(profile.id);

    if (existing) {
      const result = await this.database.query<CreatorRoomRow>(
        `UPDATE creator_rooms
         SET slug = $2,
             title = $3,
             description = $4,
             tags = $5,
             stream_key = $6,
             is_public = $7,
             access_mode = $8,
             chat_mode = $9,
             private_entry_tokens = $10,
             member_monthly_tokens = $11,
             updated_at = NOW()
         WHERE creator_profile_id = $1
         RETURNING *`,
        [
          profile.id,
          profile.slug,
          payload.title.trim(),
          payload.description?.trim() ?? '',
          tags,
          profile.slug,
          payload.isPublic ?? true,
          payload.accessMode ?? 'public',
          payload.chatMode ?? 'registered',
          payload.privateEntryTokens ?? 120,
          payload.memberMonthlyTokens ?? 450,
        ],
      );
      return this.mapRoom(result.rows[0]);
    }

    const result = await this.database.query<CreatorRoomRow>(
      `INSERT INTO creator_rooms (
         id, creator_profile_id, slug, title, description, tags, stream_key, is_public,
         access_mode, chat_mode, private_entry_tokens, member_monthly_tokens
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        randomUUID(),
        profile.id,
        profile.slug,
        payload.title.trim(),
        payload.description?.trim() ?? '',
        tags,
        profile.slug,
        payload.isPublic ?? true,
        payload.accessMode ?? 'public',
        payload.chatMode ?? 'registered',
        payload.privateEntryTokens ?? 120,
        payload.memberMonthlyTokens ?? 450,
      ],
    );
    return this.mapRoom(result.rows[0]);
  }

  async startBroadcast(userId: string) {
    const room = await this.getRoomForUser(userId);
    const active = await this.database.query<StreamSessionRow>(
      `SELECT id, room_slug, status, source, started_at, ended_at
       FROM stream_sessions
       WHERE room_slug = $1 AND status IN ('preparing', 'live')
       ORDER BY started_at DESC
       LIMIT 1`,
      [room.slug],
    );

    if (active.rows[0]) {
      return {
        roomSlug: room.slug,
        sessionId: active.rows[0].id,
        status: active.rows[0].status,
      };
    }

    const created = await this.database.query<StreamSessionRow>(
      `INSERT INTO stream_sessions (id, room_slug, status, source, started_at, ended_at)
       VALUES ($1, $2, 'preparing', 'browser', NOW(), NULL)
       RETURNING id, room_slug, status, source, started_at, ended_at`,
      [randomUUID(), room.slug],
    );

    return {
      roomSlug: room.slug,
      sessionId: created.rows[0].id,
      status: created.rows[0].status,
    };
  }

  async stopBroadcast(userId: string) {
    const room = await this.getRoomForUser(userId);
    const result = await this.database.query<StreamSessionRow>(
      `UPDATE stream_sessions
       SET status = 'ended', ended_at = NOW()
       WHERE room_slug = $1 AND status IN ('preparing', 'live')
       RETURNING id, room_slug, status, source, started_at, ended_at`,
      [room.slug],
    );

    return {
      roomSlug: room.slug,
      stoppedSessions: result.rows.length,
    };
  }

  private async findProfileByUserId(userId: string): Promise<CreatorProfile | null> {
    const result = await this.database.query<CreatorProfileRow>(
      `SELECT * FROM creator_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows[0] ? this.mapProfile(result.rows[0]) : null;
  }

  private async getRoomForUser(userId: string): Promise<CreatorRoom> {
    const profile = await this.findProfileByUserId(userId);
    if (!profile) {
      throw new BadRequestException('Create your creator profile before starting a broadcast.');
    }

    const room = await this.findRoomByProfileId(profile.id);
    if (!room) {
      throw new BadRequestException('Create your creator room before starting a broadcast.');
    }

    return room;
  }

  private async findRoomByProfileId(profileId: string): Promise<CreatorRoom | null> {
    const result = await this.database.query<CreatorRoomRow>(
      `SELECT * FROM creator_rooms WHERE creator_profile_id = $1 LIMIT 1`,
      [profileId],
    );
    return result.rows[0] ? this.mapRoom(result.rows[0]) : null;
  }

  private async syncRoomSlug(profileId: string, slug: string) {
    await this.database.query(
      `UPDATE creator_rooms
       SET slug = $2, stream_key = $2, updated_at = NOW()
       WHERE creator_profile_id = $1`,
      [profileId, slug],
    );
  }

  private normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeTags(values?: string[]) {
    return values?.map((value) => value.trim()).filter(Boolean) ?? [];
  }

  private mapProfile(row: CreatorProfileRow): CreatorProfile {
    return {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      slug: row.slug,
      bio: row.bio,
      avatarUrl: row.avatar_url ?? undefined,
      coverImageUrl: row.cover_image_url ?? undefined,
      accentColor: row.accent_color ?? undefined,
      tags: row.tags ?? [],
      age: row.age ?? undefined,
      gender: row.gender ?? undefined,
      country: row.country ?? undefined,
      city: row.city ?? undefined,
      interestedIn: row.interested_in ?? undefined,
      relationshipStatus: row.relationship_status ?? undefined,
      bodyType: row.body_type ?? undefined,
      languages: row.languages ?? [],
      categories: row.categories ?? [],
      subcategories: row.subcategories ?? [],
      instagramUrl: row.instagram_url ?? undefined,
      xUrl: row.x_url ?? undefined,
      onlyFansUrl: row.onlyfans_url ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRoom(row: CreatorRoomRow): CreatorRoom {
    return {
      id: row.id,
      creatorProfileId: row.creator_profile_id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      tags: row.tags ?? [],
      streamKey: row.stream_key,
      isPublic: row.is_public,
      accessMode: row.access_mode,
      chatMode: row.chat_mode,
      privateEntryTokens: row.private_entry_tokens,
      memberMonthlyTokens: row.member_monthly_tokens,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
