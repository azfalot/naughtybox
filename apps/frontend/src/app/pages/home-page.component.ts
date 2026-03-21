import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { StreamsApiService } from '../services/streams-api.service';

type LobbySection = 'home' | 'discover' | 'tags' | 'private' | 'following';

type StreamMeta = {
  age: number;
  genderIcon: string;
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

type DemoSeed = {
  creatorName: string;
  title: string;
  tags: string[];
  currentViewers: number;
  age: number;
  countryFlag: string;
  countryLabel: string;
  durationLabel: string;
  badgeLabel?: string;
  badgeTone?: 'new' | 'vip';
  following?: boolean;
  likes: number;
  messageCount: number;
};

const REAL_STREAM_META: Record<string, StreamMeta> = {
  'luna-en-directo': {
    age: 24,
    genderIcon: 'pi pi-user',
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
    genderIcon: 'pi pi-user',
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
    genderIcon: 'pi pi-user',
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
    genderIcon: 'pi pi-user',
    countryFlag: 'ES',
    countryLabel: 'Espana',
    durationLabel: '15 mins',
    badgeLabel: 'VIP',
    badgeTone: 'vip',
    following: true,
    likes: 156,
    messageCount: 47,
  },
};

const DEMO_SEEDS: DemoSeed[] = [
  { creatorName: 'Lola Mar', title: 'Late Night Lobby', tags: ['chat', 'vip'], currentViewers: 182, age: 23, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '48 mins', badgeLabel: 'NEW', badgeTone: 'new', following: true, likes: 96, messageCount: 34 },
  { creatorName: 'Mia Costa', title: 'Soft Neon Room', tags: ['es', 'afterhours'], currentViewers: 124, age: 21, countryFlag: 'AR', countryLabel: 'Argentina', durationLabel: '19 mins', badgeLabel: 'VIP', badgeTone: 'vip', likes: 71, messageCount: 21 },
  { creatorName: 'Vera Luz', title: 'Prime Show', tags: ['new', 'chat'], currentViewers: 212, age: 25, countryFlag: 'CO', countryLabel: 'Colombia', durationLabel: '52 mins', badgeLabel: 'NEW', badgeTone: 'new', likes: 131, messageCount: 42 },
  { creatorName: 'Nora Vale', title: 'Pink Session', tags: ['vip', 'night'], currentViewers: 87, age: 20, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '14 mins', likes: 54, messageCount: 16 },
  { creatorName: 'Alba Noir', title: 'Slow Room', tags: ['es', 'soft'], currentViewers: 64, age: 22, countryFlag: 'UY', countryLabel: 'Uruguay', durationLabel: '9 mins', badgeLabel: 'NEW', badgeTone: 'new', likes: 43, messageCount: 12 },
  { creatorName: 'Duna Vega', title: 'Open Chat', tags: ['public', 'live'], currentViewers: 201, age: 24, countryFlag: 'CL', countryLabel: 'Chile', durationLabel: '41 mins', following: true, likes: 118, messageCount: 39 },
  { creatorName: 'Iris Bloom', title: 'Midnight Club', tags: ['vip', 'club'], currentViewers: 96, age: 26, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '22 mins', badgeLabel: 'VIP', badgeTone: 'vip', likes: 63, messageCount: 18 },
  { creatorName: 'Kora Sun', title: 'Sunset Cam', tags: ['beach', 'es'], currentViewers: 149, age: 23, countryFlag: 'BR', countryLabel: 'Brasil', durationLabel: '31 mins', likes: 89, messageCount: 27 },
  { creatorName: 'Eva Fuego', title: 'Hotline Room', tags: ['afterhours', 'chat'], currentViewers: 188, age: 28, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '56 mins', badgeLabel: 'VIP', badgeTone: 'vip', likes: 121, messageCount: 33 },
  { creatorName: 'Lina Gold', title: 'Studio Night', tags: ['vip', 'gold'], currentViewers: 77, age: 24, countryFlag: 'PE', countryLabel: 'Peru', durationLabel: '11 mins', likes: 49, messageCount: 14 },
  { creatorName: 'Mara Blue', title: 'Blue Light Live', tags: ['soft', 'live'], currentViewers: 143, age: 29, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '25 mins', likes: 82, messageCount: 26 },
  { creatorName: 'Nina Drift', title: 'Private Mood', tags: ['private', 'vip'], currentViewers: 52, age: 22, countryFlag: 'MX', countryLabel: 'Mexico', durationLabel: '6 mins', badgeLabel: 'NEW', badgeTone: 'new', likes: 37, messageCount: 9 },
  { creatorName: 'Olga Mint', title: 'Mint Room', tags: ['chat', 'new'], currentViewers: 119, age: 20, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '18 mins', badgeLabel: 'NEW', badgeTone: 'new', likes: 73, messageCount: 19 },
  { creatorName: 'Paula Vox', title: 'Night Call', tags: ['es', 'call'], currentViewers: 169, age: 27, countryFlag: 'AR', countryLabel: 'Argentina', durationLabel: '44 mins', likes: 101, messageCount: 31 },
  { creatorName: 'Rita Wave', title: 'Wave Lounge', tags: ['lounge', 'public'], currentViewers: 132, age: 25, countryFlag: 'PT', countryLabel: 'Portugal', durationLabel: '16 mins', likes: 79, messageCount: 24 },
  { creatorName: 'Sonia Red', title: 'Red Room', tags: ['night', 'live'], currentViewers: 204, age: 24, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '58 mins', following: true, likes: 128, messageCount: 37 },
  { creatorName: 'Tina Lux', title: 'Lux Session', tags: ['vip', 'lux'], currentViewers: 98, age: 23, countryFlag: 'CO', countryLabel: 'Colombia', durationLabel: '13 mins', badgeLabel: 'VIP', badgeTone: 'vip', likes: 66, messageCount: 17 },
  { creatorName: 'Uma Star', title: 'Star Lounge', tags: ['new', 'chat'], currentViewers: 73, age: 21, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '7 mins', badgeLabel: 'NEW', badgeTone: 'new', likes: 45, messageCount: 11 },
  { creatorName: 'Vicky Ash', title: 'Ash Club', tags: ['club', 'vip'], currentViewers: 156, age: 26, countryFlag: 'VE', countryLabel: 'Venezuela', durationLabel: '33 mins', likes: 92, messageCount: 28 },
  { creatorName: 'Yara Moon', title: 'Moon Light', tags: ['moon', 'es'], currentViewers: 110, age: 20, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '15 mins', likes: 68, messageCount: 22 },
  { creatorName: 'Zoe Night', title: 'Night Shift', tags: ['shift', 'live'], currentViewers: 175, age: 25, countryFlag: 'CL', countryLabel: 'Chile', durationLabel: '39 mins', likes: 109, messageCount: 35 },
  { creatorName: 'Aina Soul', title: 'Soul Room', tags: ['soft', 'private'], currentViewers: 59, age: 22, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '5 mins', likes: 36, messageCount: 10 },
  { creatorName: 'Berta Sky', title: 'Sky Cam', tags: ['sky', 'public'], currentViewers: 140, age: 24, countryFlag: 'AR', countryLabel: 'Argentina', durationLabel: '27 mins', likes: 84, messageCount: 25 },
  { creatorName: 'Celia Rush', title: 'Rush Hour', tags: ['rush', 'chat'], currentViewers: 163, age: 28, countryFlag: 'ES', countryLabel: 'Espana', durationLabel: '32 mins', likes: 97, messageCount: 29 },
  { creatorName: 'Dana Kiss', title: 'Kiss Room', tags: ['vip', 'night'], currentViewers: 116, age: 23, countryFlag: 'MX', countryLabel: 'Mexico', durationLabel: '17 mins', badgeLabel: 'VIP', badgeTone: 'vip', likes: 74, messageCount: 20 },
];

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
                  <i [class]="stream.following ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
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
                    <i [class]="stream.genderIcon"></i>
                    <span class="catalog-flag">{{ stream.countryFlag }}</span>
                  </div>
                  <div class="catalog-meta-row">
                    <span><i class="pi pi-map-marker"></i> {{ stream.countryLabel }}</span>
                  </div>
                  <span class="catalog-description">{{ stream.title }}</span>
                  <div class="catalog-meta-row">
                    <span>{{ stream.durationLabel }}</span>
                    <span>{{ stream.currentViewers || 0 }} viewers</span>
                  </div>
                </div>

                <div class="catalog-metrics">
                  <span class="metric-chip">
                    <i class="pi pi-heart-fill"></i>
                    {{ stream.likes }}
                  </span>
                  <span class="metric-chip">
                    <i class="pi pi-comment"></i>
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
      'linear-gradient(135deg, rgba(255, 95, 122, 0.26), rgba(255, 145, 115, 0.18), rgba(16, 11, 24, 0.92))',
      'linear-gradient(135deg, rgba(255, 120, 146, 0.24), rgba(27, 183, 167, 0.16), rgba(18, 13, 29, 0.92))',
      'linear-gradient(135deg, rgba(255, 168, 126, 0.20), rgba(255, 89, 116, 0.18), rgba(12, 10, 20, 0.94))',
      'linear-gradient(135deg, rgba(255, 214, 203, 0.16), rgba(27, 183, 167, 0.18), rgba(12, 10, 20, 0.94))',
    ];

    const targetFallback = streams[0]?.slug ?? '';
    const realCards: DisplayStream[] = streams.map((stream, index) => ({
      ...stream,
      ...REAL_STREAM_META[stream.slug],
      accent: palette[index % palette.length],
      genderIcon: REAL_STREAM_META[stream.slug]?.genderIcon ?? 'pi pi-user',
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

    const neededDemoCount = Math.max(0, 25 - realCards.length);
    const demoCards: DisplayStream[] = DEMO_SEEDS.slice(0, neededDemoCount).map((seed, index) => ({
      id: `demo-${index + 1}`,
      slug: `demo-card-${index + 1}`,
      title: seed.title,
      creatorName: seed.creatorName,
      description: 'Demo visual para validar densidad del lobby.',
      tags: seed.tags,
      isLive: true,
      currentViewers: seed.currentViewers,
      playbackHlsUrl: '',
      accent: palette[(realCards.length + index) % palette.length],
      age: seed.age,
      genderIcon: 'pi pi-user',
      countryFlag: seed.countryFlag,
      countryLabel: seed.countryLabel,
      durationLabel: seed.durationLabel,
      badgeLabel: seed.badgeLabel,
      badgeTone: seed.badgeTone,
      following: seed.following ?? false,
      likes: seed.likes,
      messageCount: seed.messageCount,
      isDemo: true,
      targetSlug: targetFallback,
    }));

    const cards = [...realCards, ...demoCards];
    this.displayStreams.set(cards);
    this.liveCount.set(cards.filter((stream) => stream.isLive).length);
  }
}
