import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { StreamsApiService } from '../services/streams-api.service';

type LobbySection = 'home' | 'discover' | 'tags' | 'private' | 'following';

type StreamMeta = {
  age: number;
  genderBadge: string;
  countryFlag: string;
  countryLabel: string;
  durationLabel: string;
  badgeLabel?: string;
  badgeTone?: 'new' | 'vip';
  following?: boolean;
  likes: number;
  messageCount: number;
};

type DisplayStream = StreamSummary &
  StreamMeta & {
    accent: string;
    isDemo: boolean;
    targetSlug: string;
  };

const REAL_STREAM_META: Record<string, StreamMeta> = {
  'luna-en-directo': {
    age: 24,
    genderBadge: 'F',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '12 mins',
    badgeLabel: 'NEW',
    badgeTone: 'new',
    following: true,
    likes: 91,
    messageCount: 26,
  },
  'jade-after-hours': {
    age: 27,
    genderBadge: 'F',
    countryFlag: 'MX',
    countryLabel: 'Mexico',
    durationLabel: '37 mins',
    badgeLabel: 'VIP',
    badgeTone: 'vip',
    following: false,
    likes: 134,
    messageCount: 41,
  },
  'nora-after-dark': {
    age: 22,
    genderBadge: 'F',
    countryFlag: 'AR',
    countryLabel: 'Argentina',
    durationLabel: '8 mins',
    badgeLabel: 'NEW',
    badgeTone: 'new',
    following: false,
    likes: 74,
    messageCount: 18,
  },
  'lucia-velvet-live': {
    age: 26,
    genderBadge: 'F',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '15 mins',
    badgeLabel: 'VIP',
    badgeTone: 'vip',
    following: true,
    likes: 156,
    messageCount: 47,
  },
  'maya-costa-live': {
    age: 23,
    genderBadge: 'F',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '18 mins',
    badgeLabel: 'NEW',
    badgeTone: 'new',
    likes: 108,
    messageCount: 29,
  },
  'kiara-rio-live': {
    age: 25,
    genderBadge: 'F',
    countryFlag: 'CO',
    countryLabel: 'Colombia',
    durationLabel: '27 mins',
    likes: 123,
    messageCount: 35,
  },
  'sofia-velvet-room': {
    age: 28,
    genderBadge: 'F',
    countryFlag: 'AR',
    countryLabel: 'Argentina',
    durationLabel: '31 mins',
    badgeLabel: 'VIP',
    badgeTone: 'vip',
    likes: 141,
    messageCount: 41,
  },
  'alex-nero-live': {
    age: 29,
    genderBadge: 'M',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '22 mins',
    likes: 92,
    messageCount: 21,
  },
  'marco-blaze-room': {
    age: 27,
    genderBadge: 'M',
    countryFlag: 'IT',
    countryLabel: 'Italia',
    durationLabel: '14 mins',
    badgeLabel: 'NEW',
    badgeTone: 'new',
    likes: 76,
    messageCount: 18,
  },
  'diego-wave-live': {
    age: 30,
    genderBadge: 'M',
    countryFlag: 'MX',
    countryLabel: 'Mexico',
    durationLabel: '39 mins',
    likes: 119,
    messageCount: 32,
  },
  'alma-noah-duo': {
    age: 26,
    genderBadge: 'MF',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '41 mins',
    badgeLabel: 'VIP',
    badgeTone: 'vip',
    likes: 166,
    messageCount: 44,
  },
  'leo-iris-duo': {
    age: 24,
    genderBadge: 'MM',
    countryFlag: 'PT',
    countryLabel: 'Portugal',
    durationLabel: '16 mins',
    likes: 88,
    messageCount: 22,
  },
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, StreamPlayerComponent],
  template: `
    <main class="page page-wide page-catalog">
      <section class="lobby-header lobby-header-compact">
        <div>
          <p class="eyebrow">Streaming Lobby</p>
          <h1 class="lobby-title">Lobby en directo.</h1>
          <p class="muted lobby-subtitle">Cards densas, metricas claras y acceso directo a la sala del creador.</p>
        </div>

        <div class="lobby-stats">
          <div class="lobby-stat panel-card">
            <strong>{{ liveCount() }}</strong>
            <span>online</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ filteredStreams().length }}</strong>
            <span>{{ activeSection().toUpperCase() }}</span>
          </div>
        </div>
      </section>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error() && filteredStreams().length > 0" class="catalog-grid">
        <button
          type="button"
          class="catalog-card panel-card"
          *ngFor="let stream of filteredStreams()"
          (click)="enterRoom(stream)"
        >
          <div class="catalog-thumb">
            <app-stream-player
              *ngIf="stream.isLive && !stream.isDemo"
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />

            <div *ngIf="!stream.isLive || stream.isDemo" class="catalog-preview" [style.background]="stream.accent">
              <div class="catalog-monogram">{{ monogram(stream.creatorName) }}</div>
            </div>

            <div class="catalog-overlay">
              <div class="catalog-topline">
                <button type="button" class="follow-badge" (click)="toggleFollow(stream, $event)">
                  <span class="symbol-heart">{{ stream.following ? '♥' : '♡' }}</span>
                </button>
                <span *ngIf="stream.badgeLabel" [class]="'status-tag status-tag-' + (stream.badgeTone ?? 'new')">
                  {{ stream.badgeLabel }}
                </span>
              </div>

              <div class="catalog-bottomline">
                <div class="catalog-copy">
                  <div class="catalog-identity">
                    <strong>{{ stream.creatorName }}</strong>
                    <span class="catalog-age">{{ stream.age }}</span>
                    <span class="catalog-gender">{{ stream.genderBadge }}</span>
                    <span class="catalog-flag">{{ stream.countryFlag }}</span>
                  </div>
                  <div class="catalog-meta-row">
                    <span><span class="meta-symbol">◉</span> {{ stream.countryLabel }}</span>
                  </div>
                  <span class="catalog-description">{{ stream.title }}</span>
                  <div class="catalog-meta-row">
                    <span>{{ stream.durationLabel }}</span>
                    <span>{{ stream.currentViewers || 0 }} viewers</span>
                  </div>
                </div>

                <div class="catalog-metrics">
                  <span class="metric-chip">
                    <span class="meta-symbol">♥</span>
                    {{ stream.likes }}
                  </span>
                  <span class="metric-chip">
                    <span class="meta-symbol">💬</span>
                    {{ stream.messageCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </section>
    </main>
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly streamsApi = inject(StreamsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly displayStreams = signal<DisplayStream[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly liveCount = signal(0);
  readonly activeSection = signal<LobbySection>('home');
  readonly filteredStreams = computed(() => this.applySectionFilter(this.displayStreams(), this.activeSection()));

  async ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const section = params.get('section');
      if (section === 'discover' || section === 'tags' || section === 'private' || section === 'following') {
        this.activeSection.set(section);
      } else {
        this.activeSection.set('home');
      }
    });

    await this.loadStreams();
    this.refreshTimer = setInterval(() => {
      void this.loadStreams(false);
    }, 8000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  monogram(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  async enterRoom(stream: DisplayStream) {
    await this.router.navigateByUrl(`/streams/${stream.targetSlug}`);
  }

  toggleFollow(stream: DisplayStream, event: Event) {
    event.stopPropagation();
    this.displayStreams.update((current) =>
      current.map((candidate) =>
        candidate.id === stream.id ? { ...candidate, following: !candidate.following } : candidate,
      ),
    );
  }

  private async loadStreams(showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    try {
      const streams = await this.streamsApi.listStreams();
      this.populateDisplayStreams(streams);
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el catalogo.');
    } finally {
      if (showLoader) {
        this.loading.set(false);
      }
    }
  }

  private applySectionFilter(streams: DisplayStream[], section: LobbySection) {
    switch (section) {
      case 'discover':
        return [...streams].sort((a, b) => (b.currentViewers || 0) - (a.currentViewers || 0));
      case 'tags':
        return streams.filter((stream) => stream.tags.length > 0 || stream.badgeLabel);
      case 'private':
        return streams.filter((stream) =>
          [...stream.tags, ...(stream.badgeLabel ? [stream.badgeLabel.toLowerCase()] : [])].some((tag) =>
            ['vip', 'private', 'private-shows', 'tokens'].includes(tag.toLowerCase()),
          ),
        );
      case 'following':
        return streams.filter((stream) => stream.following);
      default:
        return streams;
    }
  }

  private populateDisplayStreams(streams: StreamSummary[]) {
    const palette = [
      'linear-gradient(135deg, rgba(21, 159, 149, 0.32), rgba(255, 138, 61, 0.18), rgba(7, 18, 20, 0.94))',
      'linear-gradient(135deg, rgba(255, 138, 61, 0.26), rgba(21, 159, 149, 0.14), rgba(7, 18, 20, 0.94))',
      'linear-gradient(135deg, rgba(255, 213, 176, 0.16), rgba(21, 159, 149, 0.18), rgba(7, 18, 20, 0.94))',
      'linear-gradient(135deg, rgba(21, 159, 149, 0.18), rgba(255, 213, 176, 0.16), rgba(7, 18, 20, 0.94))',
    ];

    const realCards: DisplayStream[] = streams.map((stream, index) => ({
      ...stream,
      ...REAL_STREAM_META[stream.slug],
      accent: palette[index % palette.length],
      genderBadge: REAL_STREAM_META[stream.slug]?.genderBadge ?? 'F',
      age: REAL_STREAM_META[stream.slug]?.age ?? 24,
      countryFlag: REAL_STREAM_META[stream.slug]?.countryFlag ?? 'ES',
      countryLabel: REAL_STREAM_META[stream.slug]?.countryLabel ?? 'Espana',
      durationLabel: REAL_STREAM_META[stream.slug]?.durationLabel ?? '10 mins',
      badgeLabel: REAL_STREAM_META[stream.slug]?.badgeLabel,
      badgeTone: REAL_STREAM_META[stream.slug]?.badgeTone,
      following: REAL_STREAM_META[stream.slug]?.following ?? false,
      likes: REAL_STREAM_META[stream.slug]?.likes ?? 80 + index * 17,
      messageCount: REAL_STREAM_META[stream.slug]?.messageCount ?? 20 + index * 6,
      isDemo: false,
      targetSlug: stream.slug,
    }));
    this.displayStreams.set(realCards);
    this.liveCount.set(realCards.filter((stream) => stream.isLive).length);
  }
}
