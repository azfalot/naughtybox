import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowToggleResponse, FollowedCreator, StreamAccessMode } from '@naughtybox/shared-types';
import { DatabaseService } from '../database/database.service';

type FollowRow = {
  slug: string;
  display_name: string;
  room_slug: string;
  categories: string[];
  room_tags: string[];
  followed_at: string;
};

@Injectable()
export class FollowsService {
  constructor(private readonly database: DatabaseService) {}

  async listFollowing(userId: string): Promise<FollowedCreator[]> {
    const result = await this.database.query<FollowRow>(
      `
      SELECT
        profiles.slug,
        profiles.display_name,
        rooms.slug AS room_slug,
        profiles.categories,
        rooms.tags AS room_tags,
        follows.created_at AS followed_at
      FROM user_follows follows
      INNER JOIN creator_profiles profiles ON profiles.id = follows.creator_profile_id
      INNER JOIN creator_rooms rooms ON rooms.creator_profile_id = profiles.id
      WHERE follows.user_id = $1
      ORDER BY follows.created_at DESC
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      slug: row.slug,
      displayName: row.display_name,
      roomSlug: row.room_slug,
      categories: row.categories ?? [],
      accessMode: this.resolveAccessMode(row.room_tags ?? [], row.categories ?? []),
      followedAt: row.followed_at,
    }));
  }

  async toggleFollow(userId: string, roomSlug: string): Promise<FollowToggleResponse> {
    const room = await this.database.query<{ creator_profile_id: string }>(
      `SELECT creator_profile_id FROM creator_rooms WHERE slug = $1 LIMIT 1`,
      [roomSlug],
    );

    const creatorProfileId = room.rows[0]?.creator_profile_id;
    if (!creatorProfileId) {
      throw new NotFoundException(`Room "${roomSlug}" not found.`);
    }

    const existing = await this.database.query(
      `SELECT 1 FROM user_follows WHERE user_id = $1 AND creator_profile_id = $2`,
      [userId, creatorProfileId],
    );

    if (existing.rowCount) {
      await this.database.query(
        `DELETE FROM user_follows WHERE user_id = $1 AND creator_profile_id = $2`,
        [userId, creatorProfileId],
      );
      return { slug: roomSlug, following: false };
    }

    await this.database.query(
      `INSERT INTO user_follows (user_id, creator_profile_id) VALUES ($1, $2)`,
      [userId, creatorProfileId],
    );
    return { slug: roomSlug, following: true };
  }

  async getFollowMap(userId: string | null, roomSlugs: string[]) {
    if (!userId || roomSlugs.length === 0) {
      return new Map<string, boolean>();
    }

    const result = await this.database.query<{ room_slug: string }>(
      `
      SELECT rooms.slug AS room_slug
      FROM user_follows follows
      INNER JOIN creator_rooms rooms ON rooms.creator_profile_id = follows.creator_profile_id
      WHERE follows.user_id = $1
        AND rooms.slug = ANY($2::text[])
      `,
      [userId, roomSlugs],
    );

    return new Map(result.rows.map((row) => [row.room_slug, true] as const));
  }

  private resolveAccessMode(roomTags: string[], categories: string[]): StreamAccessMode {
    const values = [...roomTags, ...categories].map((value) => value.toLowerCase());
    if (values.some((value) => ['private', 'private-shows', 'tokens'].includes(value))) {
      return 'private';
    }
    if (values.some((value) => ['premium', 'vip'].includes(value))) {
      return 'premium';
    }
    return 'public';
  }
}
