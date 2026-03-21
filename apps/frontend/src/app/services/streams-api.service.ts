import { Injectable, inject } from '@angular/core';
import { FollowToggleResponse, FollowedCreator, StreamDetails, StreamSummary } from '@naughtybox/shared-types';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class StreamsApiService {
  private readonly baseUrl = '/api';
  private readonly authApi = inject(AuthApiService);

  async listStreams(): Promise<StreamSummary[]> {
    const response = await fetch(`${this.baseUrl}/streams`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Unable to load streams');
    }

    return response.json() as Promise<StreamSummary[]>;
  }

  async getStream(slug: string): Promise<StreamDetails> {
    const response = await fetch(`${this.baseUrl}/streams/${slug}`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Unable to load stream');
    }

    return response.json() as Promise<StreamDetails>;
  }

  async listFollowing(): Promise<FollowedCreator[]> {
    const response = await fetch(`${this.baseUrl}/follows`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Unable to load follows');
    }
    return response.json() as Promise<FollowedCreator[]>;
  }

  async toggleFollow(slug: string): Promise<FollowToggleResponse> {
    const response = await fetch(`${this.baseUrl}/follows/${slug}/toggle`, {
      method: 'POST',
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Unable to update follow');
    }
    return response.json() as Promise<FollowToggleResponse>;
  }
}
