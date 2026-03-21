import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatorPublicProfile, StreamDetails, StreamSummary } from '@naughtybox/shared-types';
import { DatabaseService } from '../database/database.service';

type StreamRow = {
  room_id: string;
  room_slug: string;
  room_title: string;
  room_description: string;
  room_tags: string[];
  stream_key: string;
  is_public: boolean;
  display_name: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  profile_bio: string;
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
  website_url: string | null;
};

@Injectable()
export class StreamsService {
  constructor(private readonly database: DatabaseService) {}

  async listStreams(): Promise<StreamSummary[]> {
    const rows = await this.getPublicRoomRows();
    const liveStatus = await this.fetchLiveStatus(rows.map((row) => row.room_slug));
    return rows.map((row) => this.toSummary(row, liveStatus.get(row.room_slug) ?? false));
  }

  async getStream(slug: string): Promise<StreamDetails> {
    const result = await this.database.query<StreamRow>(
      `
      SELECT
        rooms.id AS room_id,
        rooms.slug AS room_slug,
        rooms.title AS room_title,
        rooms.description AS room_description,
        rooms.tags AS room_tags,
        rooms.stream_key,
        rooms.is_public,
        profiles.display_name,
        profiles.avatar_url,
        profiles.cover_image_url,
        profiles.accent_color,
        profiles.bio AS profile_bio,
        profiles.age,
        profiles.gender,
        profiles.country,
        profiles.city,
        profiles.interested_in,
        profiles.relationship_status,
        profiles.body_type,
        profiles.languages,
        profiles.categories,
        profiles.subcategories,
        profiles.instagram_url,
        profiles.x_url,
        profiles.website_url
      FROM creator_rooms rooms
      INNER JOIN creator_profiles profiles ON profiles.id = rooms.creator_profile_id
      WHERE rooms.slug = $1
      LIMIT 1
      `,
      [slug],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Stream "${slug}" not found.`);
    }

    const isLive = (await this.fetchLiveStatus([row.room_slug])).get(row.room_slug) ?? false;
    return this.toDetails(row, isLive);
  }

  async getBillingConfig() {
    const result = await this.database.query<{
      provider_key: string;
      status: 'researching' | 'planned' | 'active';
      notes: string;
    }>(`SELECT provider_key, status, notes FROM payment_provider_configs ORDER BY provider_key ASC`);

    return {
      mode: 'sandbox',
      tokenPackageSizes: [100, 250, 500, 1000],
      platformFeePercent: 20,
      payoutHoldDays: 14,
      providers: result.rows.map((row) => ({
        id: row.provider_key,
        name: row.provider_key.toUpperCase(),
        category: row.provider_key === 'crypto' ? 'crypto' : 'processor',
        status: row.status,
        notes: row.notes,
      })),
    };
  }

  private async getPublicRoomRows() {
    const result = await this.database.query<StreamRow>(
      `
      SELECT
        rooms.id AS room_id,
        rooms.slug AS room_slug,
        rooms.title AS room_title,
        rooms.description AS room_description,
        rooms.tags AS room_tags,
        rooms.stream_key,
        rooms.is_public,
        profiles.display_name,
        profiles.avatar_url,
        profiles.cover_image_url,
        profiles.accent_color,
        profiles.bio AS profile_bio,
        profiles.age,
        profiles.gender,
        profiles.country,
        profiles.city,
        profiles.interested_in,
        profiles.relationship_status,
        profiles.body_type,
        profiles.languages,
        profiles.categories,
        profiles.subcategories,
        profiles.instagram_url,
        profiles.x_url,
        profiles.website_url
      FROM creator_rooms rooms
      INNER JOIN creator_profiles profiles ON profiles.id = rooms.creator_profile_id
      WHERE rooms.is_public = TRUE
      ORDER BY profiles.created_at ASC
      `,
    );

    return result.rows;
  }

  private async fetchLiveStatus(slugs: string[]) {
    const mediaInternalBaseUrl = process.env.MEDIA_INTERNAL_BASE_URL ?? 'http://localhost:8888';
    const entries = await Promise.all(
      slugs.map(async (slug) => {
        try {
          const response = await fetch(`${mediaInternalBaseUrl}/live/${slug}/index.m3u8`, {
            headers: {
              Accept: 'application/vnd.apple.mpegurl,text/plain',
            },
          });

          return [slug, response.ok] as const;
        } catch {
          return [slug, false] as const;
        }
      }),
    );

    return new Map(entries);
  }

  private toSummary(row: StreamRow, isLive: boolean): StreamSummary {
    const mediaBaseUrl = process.env.MEDIA_BASE_URL ?? 'http://localhost:4200/media';
    return {
      id: row.room_id,
      slug: row.room_slug,
      title: row.room_title,
      creatorName: row.display_name,
      description: row.room_description,
      tags: row.room_tags ?? [],
      isLive,
      currentViewers: 0,
      thumbnailUrl: row.avatar_url ?? undefined,
      playbackHlsUrl: `${mediaBaseUrl}/live/${row.room_slug}/index.m3u8`,
    };
  }

  private toDetails(row: StreamRow, isLive: boolean): StreamDetails {
    const publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const mediaBaseUrl = process.env.MEDIA_BASE_URL ?? 'http://localhost:4200/media';
    const publishBaseUrl = process.env.RTMP_PUBLISH_URL ?? 'rtmp://localhost:1935/live';

    return {
      ...this.toSummary(row, isLive),
      playback: {
        hlsUrl: `${mediaBaseUrl}/live/${row.room_slug}/index.m3u8`,
        shareUrl: `${publicApiBaseUrl}/streams/${row.room_slug}`,
      },
      publish: {
        rtmpUrl: publishBaseUrl,
        streamKey: row.stream_key,
        obsServer: publishBaseUrl,
      },
      creatorProfile: this.toPublicProfile(row),
    };
  }

  private toPublicProfile(row: StreamRow): CreatorPublicProfile {
    return {
      displayName: row.display_name,
      slug: row.room_slug,
      bio: row.profile_bio,
      avatarUrl: row.avatar_url ?? undefined,
      coverImageUrl: row.cover_image_url ?? undefined,
      accentColor: row.accent_color ?? undefined,
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
      websiteUrl: row.website_url ?? undefined,
    };
  }
}
