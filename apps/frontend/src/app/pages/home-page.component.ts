import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { StreamsApiService } from '../services/streams-api.service';

type DisplayStream = StreamSummary & {
  accent: string;
  likes: number;
  messageCount: number;
  isDemo: boolean;
  targetSlug: string;
};

type DemoSeed = {
  creatorName: string;
  title: string;
  tags: string[];
  currentViewers: number;
  likes: number;
  messageCount: number;
};

const DEMO_SEEDS: DemoSeed[] = [
  { creatorName: 'Lola Mar', title: 'Late Night Lobby', tags: ['chat', 'vip'], currentViewers: 182, likes: 96, messageCount: 34 },
  { creatorName: 'Mia Costa', title: 'Soft Neon Room', tags: ['es', 'afterhours'], currentViewers: 124, likes: 71, messageCount: 21 },
  { creatorName: 'Vera Luz', title: 'Prime Show', tags: ['new', 'chat'], currentViewers: 212, likes: 131, messageCount: 42 },
  { creatorName: 'Nora Vale', title: 'Pink Session', tags: ['vip', 'night'], currentViewers: 87, likes: 54, messageCount: 16 },
  { creatorName: 'Alba Noir', title: 'Slow Room', tags: ['es', 'soft'], currentViewers: 64, likes: 43, messageCount: 12 },
  { creatorName: 'Duna Vega', title: 'Open Chat', tags: ['public', 'live'], currentViewers: 201, likes: 118, messageCount: 39 },
  { creatorName: 'Iris Bloom', title: 'Midnight Club', tags: ['vip', 'club'], currentViewers: 96, likes: 63, messageCount: 18 },
  { creatorName: 'Kora Sun', title: 'Sunset Cam', tags: ['beach', 'es'], currentViewers: 149, likes: 89, messageCount: 27 },
  { creatorName: 'Eva Fuego', title: 'Hotline Room', tags: ['afterhours', 'chat'], currentViewers: 188, likes: 121, messageCount: 33 },
  { creatorName: 'Lina Gold', title: 'Studio Night', tags: ['vip', 'gold'], currentViewers: 77, likes: 49, messageCount: 14 },
  { creatorName: 'Mara Blue', title: 'Blue Light Live', tags: ['soft', 'live'], currentViewers: 143, likes: 82, messageCount: 26 },
  { creatorName: 'Nina Drift', title: 'Private Mood', tags: ['private', 'vip'], currentViewers: 52, likes: 37, messageCount: 9 },
  { creatorName: 'Olga Mint', title: 'Mint Room', tags: ['chat', 'new'], currentViewers: 119, likes: 73, messageCount: 19 },
  { creatorName: 'Paula Vox', title: 'Night Call', tags: ['es', 'call'], currentViewers: 169, likes: 101, messageCount: 31 },
  { creatorName: 'Rita Wave', title: 'Wave Lounge', tags: ['lounge', 'public'], currentViewers: 132, likes: 79, messageCount: 24 },
  { creatorName: 'Sonia Red', title: 'Red Room', tags: ['night', 'live'], currentViewers: 204, likes: 128, messageCount: 37 },
  { creatorName: 'Tina Lux', title: 'Lux Session', tags: ['vip', 'lux'], currentViewers: 98, likes: 66, messageCount: 17 },
  { creatorName: 'Uma Star', title: 'Star Lounge', tags: ['new', 'chat'], currentViewers: 73, likes: 45, messageCount: 11 },
  { creatorName: 'Vicky Ash', title: 'Ash Club', tags: ['club', 'vip'], currentViewers: 156, likes: 92, messageCount: 28 },
  { creatorName: 'Yara Moon', title: 'Moon Light', tags: ['moon', 'es'], currentViewers: 110, likes: 68, messageCount: 22 },
  { creatorName: 'Zoe Night', title: 'Night Shift', tags: ['shift', 'live'], currentViewers: 175, likes: 109, messageCount: 35 },
  { creatorName: 'Aina Soul', title: 'Soul Room', tags: ['soft', 'private'], currentViewers: 59, likes: 36, messageCount: 10 },
  { creatorName: 'Berta Sky', title: 'Sky Cam', tags: ['sky', 'public'], currentViewers: 140, likes: 84, messageCount: 25 },
  { creatorName: 'Celia Rush', title: 'Rush Hour', tags: ['rush', 'chat'], currentViewers: 163, likes: 97, messageCount: 29 },
  { creatorName: 'Dana Kiss', title: 'Kiss Room', tags: ['vip', 'night'], currentViewers: 116, likes: 74, messageCount: 20 },
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
          <p class="muted lobby-subtitle">Vídeo primero, overlays compactos y acceso rápido sin romper la parrilla.</p>
        </div>

        <div class="lobby-stats">
          <div class="lobby-stat panel-card">
            <strong>{{ liveCount() }}</strong>
            <span>online</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ displayStreams().length }}</strong>
            <span>salas</span>
          </div>
        </div>
      </section>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error() && displayStreams().length > 0" class="catalog-grid">
        <button
          type="button"
          class="catalog-card panel-card"
          *ngFor="let stream of displayStreams()"
          (click)="openAccess(stream)"
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
                <span [class]="stream.isLive ? 'badge-live' : 'badge-offline'">
                  {{ stream.isLive ? 'Live' : 'Offline' }}
                </span>
                <span class="viewer-pill">
                  <i class="pi pi-users"></i>
                  {{ stream.currentViewers || 0 }}
                </span>
              </div>

              <div class="catalog-bottomline">
                <div class="catalog-copy">
                  <strong>{{ stream.creatorName }}</strong>
                  <span>{{ stream.title }}</span>
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

      <div *ngIf="selectedStream()" class="modal-backdrop" (click)="closeAccess()">
        <section class="access-modal panel-card" (click)="$event.stopPropagation()">
          <p class="eyebrow">Acceso</p>
          <h2>{{ selectedStream()!.creatorName }}</h2>
          <p class="muted access-copy">{{ selectedStream()!.title }}</p>

          <div class="access-meta">
            <span [class]="selectedStream()!.isLive ? 'badge-live' : 'badge-offline'">
              {{ selectedStream()!.isLive ? 'En directo' : 'Offline' }}
            </span>
            <span class="viewer-pill">
              <i class="pi pi-users"></i>
              {{ selectedStream()!.currentViewers || 0 }}
            </span>
          </div>

          <div class="access-actions">
            <button type="button" class="text-link" (click)="enterRoom()">Entrar en sala</button>
            <button type="button" class="icon-button" (click)="closeAccess()">Cerrar</button>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly streamsApi = inject(StreamsApiService);
  private readonly router = inject(Router);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly displayStreams = signal<DisplayStream[]>([]);
  readonly selectedStream = signal<DisplayStream | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly liveCount = signal(0);

  async ngOnInit() {
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

  openAccess(stream: DisplayStream) {
    this.selectedStream.set(stream);
  }

  closeAccess() {
    this.selectedStream.set(null);
  }

  async enterRoom() {
    const stream = this.selectedStream();
    if (!stream) {
      return;
    }

    await this.router.navigateByUrl(`/streams/${stream.targetSlug}`);
    this.closeAccess();
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

  private populateDisplayStreams(streams: StreamSummary[]) {
    const visibleRealStreams = streams.filter((stream) => stream.slug !== 'sara-night-show');
    const palette = [
      'linear-gradient(135deg, rgba(255, 95, 122, 0.26), rgba(255, 145, 115, 0.18), rgba(16, 11, 24, 0.92))',
      'linear-gradient(135deg, rgba(255, 120, 146, 0.24), rgba(255, 97, 120, 0.16), rgba(18, 13, 29, 0.92))',
      'linear-gradient(135deg, rgba(255, 168, 126, 0.20), rgba(255, 89, 116, 0.18), rgba(12, 10, 20, 0.94))',
      'linear-gradient(135deg, rgba(255, 214, 203, 0.16), rgba(255, 105, 133, 0.18), rgba(12, 10, 20, 0.94))',
    ];

    const targetFallback = visibleRealStreams[0]?.slug ?? streams[0]?.slug ?? '';
    const realCards: DisplayStream[] = visibleRealStreams.map((stream, index) => ({
      ...stream,
      accent: palette[index % palette.length],
      likes: 80 + index * 17,
      messageCount: 20 + index * 6,
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
