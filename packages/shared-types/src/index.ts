/**
 * Shared types used across backend, streaming, and frontend.
 */

export type UserRole = 'viewer' | 'creator' | 'admin';
export type StreamSessionStatus = 'preparing' | 'live' | 'ended';
export type StreamRoomPresence = 'loading' | 'preparing' | 'live' | 'offline';

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
  coverImageUrl?: string;
  accentColor?: string;
  tags: string[];
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  interestedIn?: string;
  relationshipStatus?: string;
  bodyType?: string;
  languages: string[];
  categories: string[];
  subcategories: string[];
  instagramUrl?: string;
  xUrl?: string;
  onlyFansUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorPublicProfile {
  displayName: string;
  slug: string;
  bio: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  accentColor?: string;
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  interestedIn?: string;
  relationshipStatus?: string;
  bodyType?: string;
  languages: string[];
  categories: string[];
  subcategories: string[];
  instagramUrl?: string;
  xUrl?: string;
  onlyFansUrl?: string;
  websiteUrl?: string;
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
  accessMode: StreamAccessMode;
  chatMode: ChatAccessMode;
  privateEntryTokens: number;
  memberMonthlyTokens: number;
  createdAt: string;
  updatedAt: string;
}

export type StreamAccessMode = 'public' | 'premium' | 'private';
export type ChatAccessMode = 'registered' | 'members' | 'tippers';

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
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  categories?: string[];
  subcategories?: string[];
  accessMode?: StreamAccessMode;
  following?: boolean;
  activeSessionId?: string;
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

export interface StreamSession {
  id: string;
  roomSlug: string;
  streamKey: string;
  source: 'detected' | 'browser' | 'obs';
  status: StreamSessionStatus;
  startedAt: string;
  endedAt?: string;
}

export interface StreamDetails extends Omit<StreamSummary, 'playbackHlsUrl'> {
  playback: StreamPlayback;
  publish: StreamPublish;
  creatorProfile?: CreatorPublicProfile;
  viewerAccess?: ViewerRoomAccess;
  activeSession?: StreamSession | null;
}

export interface ResolveStreamRoomPresenceInput {
  isLoading: boolean;
  isLive?: boolean;
  activeSessionStatus?: StreamSessionStatus | null;
}

export function resolveStreamRoomPresence(input: ResolveStreamRoomPresenceInput): StreamRoomPresence {
  if (input.isLoading) return 'loading';
  if (input.isLive || input.activeSessionStatus === 'live') return 'live';
  if (input.activeSessionStatus === 'preparing') return 'preparing';
  return 'offline';
}

export interface ViewerRoomAccess {
  accessMode: StreamAccessMode;
  chatMode: ChatAccessMode;
  privateEntryTokens: number;
  memberMonthlyTokens: number;
  canWatch: boolean;
  canChat: boolean;
  isMember: boolean;
  hasPrivateAccess: boolean;
}

export interface FollowedCreator {
  slug: string;
  displayName: string;
  roomSlug: string;
  categories: string[];
  accessMode: StreamAccessMode;
  followedAt: string;
}

export interface FollowToggleResponse {
  slug: string;
  following: boolean;
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
  coverImageUrl?: string;
  accentColor?: string;
  tags?: string[];
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  interestedIn?: string;
  relationshipStatus?: string;
  bodyType?: string;
  languages?: string[];
  categories?: string[];
  subcategories?: string[];
  instagramUrl?: string;
  xUrl?: string;
  onlyFansUrl?: string;
  websiteUrl?: string;
}

export interface UpsertCreatorRoomRequest {
  title: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  accessMode?: StreamAccessMode;
  chatMode?: ChatAccessMode;
  privateEntryTokens?: number;
  memberMonthlyTokens?: number;
}

export interface PaymentProviderOption {
  id: string;
  name: string;
  category: 'processor' | 'crypto' | 'wallet';
  status: 'researching' | 'planned' | 'active';
  notes: string;
}

export interface BillingConfig {
  mode: 'sandbox' | 'live';
  tokenPackageSizes: number[];
  platformFeePercent: number;
  payoutHoldDays: number;
  providers: PaymentProviderOption[];
}

export interface ChatMessage {
  id: string;
  roomSlug: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SendChatMessageRequest {
  roomSlug: string;
  body: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  roomSlug?: string;
  type: 'credit' | 'debit' | 'tip_sent' | 'tip_received';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  recentTransactions: TokenTransaction[];
}

export interface TipCreatorRequest {
  roomSlug: string;
  amount: number;
  note?: string;
}

export interface UnlockRoomAccessResponse extends ViewerRoomAccess {
  roomSlug: string;
}
