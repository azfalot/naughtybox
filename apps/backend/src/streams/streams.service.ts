import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatorPublicProfile, StreamDetails, StreamSession, StreamSummary } from '@naughtybox/shared-types';
import { DatabaseService } from '../database/database.service';
import { FollowsService } from '../follows/follows.service';
import { RoomAccessService } from '../room-access/room-access.service';
import { StreamSessionsService } from '../stream-sessions/stream-sessions.service';

type StreamRow = {
  room_id: string;
  room_slug: string;
  room_title: string;
  room_description: string;
  room_tags: string[];
  stream_key: string;
  is_public: boolean;
  access_mode: 'public' | 'premium' | 'private';
  chat_mode: 'registered' | 'members' | 'tippers';
  private_entry_tokens: number;
  member_monthly_tokens: number;
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
  onlyfans_url: string | null;
  website_url: string | null;
};

@Injectable()
export class StreamsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly followsService: FollowsService,
    private readonly roomAccessService: RoomAccessService,
    private readonly streamSessionsService: StreamSessionsService,
  ) {}

  async listStreams(viewerId: string | null = null): Promise<StreamSummary[]> {
    const rows = await this.getPublicRoomRows();
    const liveStatus = await this.fetchLiveStatus(rows.map((row) => row.stream_key));
    const followMap = await this.followsService.getFollowMap(viewerId, rows.map((row) => row.room_slug));
    const sessions = await Promise.all(
      rows.map((row) =>
        this.streamSessionsService.reconcile(row.room_slug, row.stream_key, liveStatus.get(row.stream_key) ?? false),
      ),
    );
    return rows.map((row, i) =>
      this.toSummary(row, liveStatus.get(row.stream_key) ?? false, followMap.get(row.room_slug) ?? false, sessions[i] ?? null),
    );
  }

  async getStream(slug: string, viewerId: string | null = null): Promise<StreamDetails> {
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
        rooms.access_mode,
        rooms.chat_mode,
        rooms.private_entry_tokens,
        rooms.member_monthly_tokens,
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
        profiles.onlyfans_url,
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

    const isLive = (await this.fetchLiveStatus([row.stream_key])).get(row.stream_key) ?? false;
    const session = await this.streamSessionsService.reconcile(row.room_slug, row.stream_key, isLive);
    const followMap = await this.followsService.getFollowMap(viewerId, [row.room_slug]);
    return this.toDetails(row, isLive, followMap.get(row.room_slug) ?? false, await this.roomAccessService.getViewerAccess(row.room_slug, viewerId), session ?? null);
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
        rooms.access_mode,
        rooms.chat_mode,
        rooms.private_entry_tokens,
        rooms.member_monthly_tokens,
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
        profiles.onlyfans_url,
        profiles.website_url
      FROM creator_rooms rooms
      INNER JOIN creator_profiles profiles ON profiles.id = rooms.creator_profile_id
      WHERE rooms.is_public = TRUE
      ORDER BY profiles.created_at ASC
      `,
    );

    return result.rows;
  }

  private async fetchLiveStatus(streamKeys: string[]) {
    const mediaApiBaseUrl = process.env.MEDIA_API_INTERNAL_BASE_URL ?? 'http://localhost:9997';
    try {
      const response = await fetch(`${mediaApiBaseUrl}/v3/paths/list`);
      if (response.ok) {
        const data = (await response.json()) as { items?: Array<{ name: string; ready: boolean }> };
        const activePaths = new Set(
          (data.items ?? []).filter((p) => p.ready).map((p) => p.name),
        );
        return new Map(streamKeys.map((key) => [key, activePaths.has(key)] as const));
      }
    } catch {
      // MediaMTX not reachable
    }
    return new Map(streamKeys.map((key) => [key, false] as const));
  }

  private toSummary(row: StreamRow, isLive: boolean, following = false, activeSession: StreamSession | null = null): StreamSummary {
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
      playbackHlsUrl: `${mediaBaseUrl}/live/${row.stream_key}/index.m3u8`,
      age: row.age ?? undefined,
      gender: row.gender ?? undefined,
      country: row.country ?? undefined,
      city: row.city ?? undefined,
      categories: row.categories ?? [],
      subcategories: row.subcategories ?? [],
      accessMode: row.access_mode,
      following,
      activeSessionId: activeSession?.id,
    };
  }

  private toDetails(
    row: StreamRow,
    isLive: boolean,
    following = false,
    viewerAccess?: StreamDetails['viewerAccess'],
    activeSession: StreamSession | null = null,
  ): StreamDetails {
    const publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const mediaBaseUrl = process.env.MEDIA_BASE_URL ?? 'http://localhost:4200/media';
    const publishBaseUrl = process.env.RTMP_PUBLISH_URL ?? 'rtmp://localhost:1935/live';

    return {
      ...this.toSummary(row, isLive, following, activeSession),
      playback: {
        hlsUrl: `${mediaBaseUrl}/live/${row.stream_key}/index.m3u8`,
        shareUrl: `${publicApiBaseUrl}/streams/${row.room_slug}`,
      },
      publish: {
        rtmpUrl: publishBaseUrl,
        streamKey: row.stream_key,
        obsServer: publishBaseUrl,
      },
      creatorProfile: this.toPublicProfile(row),
      viewerAccess,
      activeSession,
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
      onlyFansUrl: row.onlyfans_url ?? undefined,
      websiteUrl: row.website_url ?? undefined,
    };
  }
}
