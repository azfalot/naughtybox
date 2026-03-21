import { Injectable } from '@angular/core';
import { StreamDetails, StreamSummary } from '@naughtybox/shared-types';

@Injectable({
  providedIn: 'root',
})
export class StreamsApiService {
  private readonly baseUrl = '/api';

  async listStreams(): Promise<StreamSummary[]> {
    const response = await fetch(`${this.baseUrl}/streams`);
    if (!response.ok) {
      throw new Error('Unable to load streams');
    }

    return response.json() as Promise<StreamSummary[]>;
  }

  async getStream(slug: string): Promise<StreamDetails> {
    const response = await fetch(`${this.baseUrl}/streams/${slug}`);
    if (!response.ok) {
      throw new Error('Unable to load stream');
    }

    return response.json() as Promise<StreamDetails>;
  }
}
