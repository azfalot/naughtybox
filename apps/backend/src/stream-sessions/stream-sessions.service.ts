import { Injectable } from '@nestjs/common';
import { StreamSession } from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

type StreamSessionRow = {
  id: string;
  room_slug: string;
  stream_key: string;
  source: 'detected' | 'browser' | 'obs';
  started_at: string;
  ended_at: string | null;
  status: 'preparing' | 'live' | 'ended';
};

@Injectable()
export class StreamSessionsService {
  constructor(private readonly database: DatabaseService) {}

  async reconcile(roomSlug: string, streamKey: string, isLive: boolean, source: StreamSession['source'] = 'detected') {
    const active = await this.getCurrentSessionRow(roomSlug);

    if (isLive) {
      if (active) {
        if (active.status === 'live') {
          return this.mapSession(active);
        }

        const result = await this.database.query<StreamSessionRow>(
          `UPDATE stream_sessions
           SET status = 'live',
               stream_key = $2,
               source = CASE WHEN source = 'browser' THEN source ELSE $3 END
           WHERE id = $1
           RETURNING *`,
          [active.id, streamKey, source],
        );

        return this.mapSession(result.rows[0]);
      }

      const result = await this.database.query<StreamSessionRow>(
        `INSERT INTO stream_sessions (id, room_slug, stream_key, source, status)
         VALUES ($1, $2, $3, $4, 'live')
         RETURNING *`,
        [randomUUID(), roomSlug, streamKey, source],
      );

      return this.mapSession(result.rows[0]);
    }

    if (active?.status === 'live') {
      await this.database.query(
        `UPDATE stream_sessions
         SET status = 'ended', ended_at = NOW()
         WHERE id = $1`,
        [active.id],
      );
      return null;
    }

    if (active?.status === 'preparing') {
      const stale = Date.now() - new Date(active.started_at).getTime() > 10 * 60 * 1000;
      if (stale) {
        await this.database.query(
          `UPDATE stream_sessions
           SET status = 'ended', ended_at = NOW()
           WHERE id = $1`,
          [active.id],
        );
        return null;
      }

      return this.mapSession(active);
    }

    return null;
  }

  async getActiveSession(roomSlug: string): Promise<StreamSession | null> {
    const row = await this.getLiveSessionRow(roomSlug);
    return row ? this.mapSession(row) : null;
  }

  async getCurrentSession(roomSlug: string): Promise<StreamSession | null> {
    const row = await this.getCurrentSessionRow(roomSlug);
    return row ? this.mapSession(row) : null;
  }

  async beginPreparing(roomSlug: string, streamKey: string, source: StreamSession['source'] = 'browser') {
    const current = await this.getCurrentSessionRow(roomSlug);
    if (current) {
      return this.mapSession(current);
    }

    const result = await this.database.query<StreamSessionRow>(
      `INSERT INTO stream_sessions (id, room_slug, stream_key, source, status)
       VALUES ($1, $2, $3, $4, 'preparing')
       RETURNING *`,
      [randomUUID(), roomSlug, streamKey, source],
    );

    return this.mapSession(result.rows[0]);
  }

  async endCurrentSession(roomSlug: string) {
    const current = await this.getCurrentSessionRow(roomSlug);
    if (!current) {
      return null;
    }

    await this.database.query(
      `UPDATE stream_sessions
       SET status = 'ended', ended_at = NOW()
       WHERE id = $1`,
      [current.id],
    );

    return null;
  }

  private async getCurrentSessionRow(roomSlug: string) {
    const result = await this.database.query<StreamSessionRow>(
      `SELECT *
       FROM stream_sessions
       WHERE room_slug = $1 AND status IN ('preparing', 'live')
       ORDER BY started_at DESC
       LIMIT 1`,
      [roomSlug],
    );

    return result.rows[0] ?? null;
  }

  private async getLiveSessionRow(roomSlug: string) {
    const result = await this.database.query<StreamSessionRow>(
      `SELECT *
       FROM stream_sessions
       WHERE room_slug = $1 AND status = 'live'
       ORDER BY started_at DESC
       LIMIT 1`,
      [roomSlug],
    );

    return result.rows[0] ?? null;
  }

  private mapSession(row: StreamSessionRow): StreamSession {
    return {
      id: row.id,
      roomSlug: row.room_slug,
      streamKey: row.stream_key,
      source: row.source,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      status: row.status,
    };
  }
}
