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
