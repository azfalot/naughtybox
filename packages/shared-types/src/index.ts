/**
 * Shared types used across backend, streaming, and frontend.
 */

export type UserRole = 'viewer' | 'creator' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  bio: string;
  avatarUrl?: string;
  accentColor?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatorRoom {
  id: string;
  creatorProfileId: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  streamKey: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CreatorDashboard {
  user: User;
  profile: CreatorProfile | null;
  room: CreatorRoom | null;
  stream: StreamDetails | null;
}

export interface UpsertCreatorProfileRequest {
  displayName: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  accentColor?: string;
  tags?: string[];
}

export interface UpsertCreatorRoomRequest {
  title: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface PaymentProviderOption {
  id: string;
  name: string;
  category: 'processor' | 'crypto' | 'wallet';
  status: 'researching' | 'planned' | 'active';
  notes: string;
}

export interface BillingConfig {
  tokenPackageSizes: number[];
  platformFeePercent: number;
  payoutHoldDays: number;
  providers: PaymentProviderOption[];
}
