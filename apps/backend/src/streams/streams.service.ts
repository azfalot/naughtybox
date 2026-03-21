import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateStreamRequest,
  StreamDetails,
  StreamSummary,
} from '@naughtybox/shared-types';

type StreamRecord = StreamDetails;

@Injectable()
export class StreamsService {
  private readonly streams = new Map<string, StreamRecord>();

  constructor() {
    const seedStreams: StreamRecord[] = [
      this.buildStream({
        slug: 'luna-en-directo',
        title: 'Luna en directo',
        creatorName: 'Luna Vega',
        description: 'Sala demo para validar el flujo OBS -> MediaMTX -> HLS.',
        tags: ['demo', 'es', 'public'],
        isLive: false,
      }),
      this.buildStream({
        slug: 'sara-night-show',
        title: 'Sara Night Show',
        creatorName: 'Sara Bloom',
        description: 'Segunda sala publica para probar el listado.',
        tags: ['night', 'public'],
        isLive: false,
      }),
    ];

    seedStreams.forEach((stream) => {
      this.streams.set(stream.slug, stream);
    });
  }

  async listStreams(): Promise<StreamSummary[]> {
    const liveStatusMap = await this.fetchLiveStatus();

    return [...this.streams.values()].map((stream) => {
      const status = liveStatusMap.get(stream.slug);

      return {
        id: stream.id,
        slug: stream.slug,
        title: stream.title,
        creatorName: stream.creatorName,
        description: stream.description,
        tags: stream.tags,
        isLive: status?.isLive ?? false,
        currentViewers: 0,
        thumbnailUrl: stream.thumbnailUrl,
        playbackHlsUrl: stream.playback.hlsUrl,
      };
    });
  }

  async getStream(slug: string): Promise<StreamDetails> {
    const stream = this.streams.get(slug);

    if (!stream) {
      throw new NotFoundException(`Stream "${slug}" not found.`);
    }

    const status = (await this.fetchLiveStatus()).get(slug);

    return {
      ...stream,
      isLive: status?.isLive ?? false,
      currentViewers: 0,
    };
  }

  createStream(payload: CreateStreamRequest): StreamDetails {
    const stream = this.buildStream({
      ...payload,
      isLive: false,
    });

    this.streams.set(stream.slug, stream);
    return stream;
  }

  private async fetchLiveStatus(): Promise<Map<string, { isLive: boolean }>> {
    const mediaInternalBaseUrl = process.env.MEDIA_INTERNAL_BASE_URL ?? 'http://localhost:8888';

    const statuses = await Promise.all(
      [...this.streams.values()].map(async (stream) => {
        try {
          const response = await fetch(`${mediaInternalBaseUrl}/live/${stream.slug}/index.m3u8`, {
            headers: {
              Accept: 'application/vnd.apple.mpegurl,text/plain',
            },
          });

          return [stream.slug, { isLive: response.ok }] as const;
        } catch {
          return [stream.slug, { isLive: false }] as const;
        }
      }),
    );

    return new Map(statuses);
  }

  private buildStream(input: {
    slug: string;
    title: string;
    creatorName: string;
    description?: string;
    tags?: string[];
    isLive: boolean;
  }): StreamRecord {
    const publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const mediaBaseUrl = process.env.MEDIA_BASE_URL ?? 'http://localhost:8888';
    const publishBaseUrl = process.env.RTMP_PUBLISH_URL ?? 'rtmp://localhost:1935/live';

    return {
      id: `stream_${input.slug}`,
      slug: input.slug,
      title: input.title,
      creatorName: input.creatorName,
      description: input.description ?? '',
      tags: input.tags ?? [],
      isLive: input.isLive,
      playback: {
        hlsUrl: `${mediaBaseUrl}/live/${input.slug}/index.m3u8`,
        shareUrl: `/streams/${input.slug}`,
      },
      publish: {
        rtmpUrl: publishBaseUrl,
        streamKey: input.slug,
        obsServer: publishBaseUrl,
      },
    };
  }
}
