/**
 * Shared types used across backend, streaming, and frontend.
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
}

export interface StreamSession {
  id: string;
  streamerId: string;
  startedAt: string;
  endedAt?: string;
}

export interface StreamSummary {
  id: string;
  slug: string;
  title: string;
  creatorName: string;
  description: string;
  tags: string[];
  isLive: boolean;
  currentViewers?: number;
  thumbnailUrl?: string;
  playbackHlsUrl: string;
}

export interface StreamPlayback {
  hlsUrl: string;
  shareUrl: string;
}

export interface StreamPublish {
  rtmpUrl: string;
  streamKey: string;
  obsServer: string;
}

export interface StreamDetails extends Omit<StreamSummary, 'playbackHlsUrl'> {
  playback: StreamPlayback;
  publish: StreamPublish;
}

export interface CreateStreamRequest {
  slug: string;
  title: string;
  creatorName: string;
  description?: string;
  tags?: string[];
}
