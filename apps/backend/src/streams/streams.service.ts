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
    const seedStreams = this.buildSeedStreams();

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

  private buildSeedStreams(): StreamRecord[] {
    const seeds = [
      ['luna-en-directo', 'Luna en directo', 'Luna Vega', ['demo', 'es', 'public']],
      ['sara-night-show', 'Sara Night Show', 'Sara Bloom', ['night', 'public']],
      ['jade-after-hours', 'Jade After Hours', 'Jade Sol', ['afterhours', 'vip']],
      ['mia-teal-room', 'Mia Teal Room', 'Mia Costa', ['teal', 'chill']],
      ['amber-midnight', 'Amber Midnight', 'Amber Rey', ['midnight', 'chat']],
      ['kiara-live', 'Kiara Live', 'Kiara Lux', ['live', 'fans']],
      ['sofia-noches', 'Sofia Noches', 'Sofia Mar', ['es', 'sensual']],
      ['nina-lounge', 'Nina Lounge', 'Nina Star', ['lounge', 'premium']],
      ['iris-velvet', 'Iris Velvet', 'Iris Blue', ['velvet', 'soft']],
      ['alma-sin-filtro', 'Alma Sin Filtro', 'Alma Rose', ['raw', 'es']],
      ['brisa-room', 'Brisa Room', 'Brisa Dawn', ['calm', 'private']],
      ['coral-live', 'Coral Live', 'Coral Lee', ['coral', 'late']],
      ['dana-afterdark', 'Dana Afterdark', 'Dana Night', ['afterdark', 'vip']],
      ['elsa-open-room', 'Elsa Open Room', 'Elsa Moon', ['open', 'public']],
      ['faye-stream', 'Faye Stream', 'Faye Noir', ['fanclub', 'slow']],
      ['gina-private-preview', 'Gina Private Preview', 'Gina Vale', ['preview', 'vip']],
      ['helena-late-club', 'Helena Late Club', 'Helena Fox', ['club', 'night']],
      ['isabel-directo', 'Isabel Directo', 'Isabel Sky', ['es', 'public']],
      ['juno-vibes', 'Juno Vibes', 'Juno Hart', ['vibes', 'chat']],
      ['kara-neon-room', 'Kara Neon Room', 'Kara Mint', ['neon', 'fans']],
      ['lola-salon', 'Lola Salon', 'Lola Wave', ['salon', 'lounge']],
      ['maya-aftershow', 'Maya Aftershow', 'Maya Flame', ['aftershow', 'premium']],
      ['noa-clubhouse', 'Noa Clubhouse', 'Noa Joy', ['clubhouse', 'vip']],
      ['olivia-live-suite', 'Olivia Live Suite', 'Olivia Dawn', ['suite', 'live']],
      ['paula-teaser-room', 'Paula Teaser Room', 'Paula Vale', ['teaser', 'fans']],
    ] as const;

    return seeds.map(([slug, title, creatorName, tags], index) =>
      this.buildStream({
        slug,
        title,
        creatorName,
        description: `Sala demo ${index + 1} para validar layout, descubrimiento y navegacion del producto.`,
        tags: [...tags],
        isLive: false,
      }),
    );
  }
}
