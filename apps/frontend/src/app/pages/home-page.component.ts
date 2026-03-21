import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamsApiService } from '../services/streams-api.service';
import { StreamPlayerComponent } from '../stream-player.component';

type DisplayStream = StreamSummary & {
  demoMode: boolean;
  accent: string;
  teaser: string;
  thumbnailSrc?: string;
};

const VIRTUAL_MODEL_THUMBNAILS: Record<string, string> = {
  'sara-night-show': '/assets/models/sara-bloom.svg',
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page page-wide">
      <section class="lobby-header">
        <div>
          <p class="eyebrow">Streaming Lobby</p>
          <h1 class="lobby-title">Directos listos para entrar.</h1>
        </div>

        <div class="lobby-stats">
          <div class="lobby-stat panel-card">
            <strong>{{ realLiveCount() }}</strong>
            <span>reales</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ demoCount() }}</strong>
            <span>demo</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ displayStreams().length }}</strong>
            <span>visibles</span>
          </div>
        </div>
      </section>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error()" class="stream-grid">
        <a
          class="stream-card panel-card stream-card-link"
          *ngFor="let stream of displayStreams()"
          [routerLink]="['/streams', stream.slug]"
          [attr.aria-label]="'Entrar en la sala de ' + stream.creatorName"
        >
          <div class="stream-thumb stream-thumb-player">
            <app-stream-player
              *ngIf="!stream.demoMode && stream.isLive"
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />

            <div
              *ngIf="stream.demoMode || !stream.isLive"
              class="mock-preview"
              [style.background]="stream.accent"
            >
              <img
                *ngIf="stream.thumbnailSrc"
                class="mock-preview-image"
                [src]="stream.thumbnailSrc"
                [alt]="'Preview virtual de ' + stream.creatorName"
              />
              <div class="mock-preview-copy">
                <strong>{{ stream.creatorName }}</strong>
                <span>{{ stream.teaser }}</span>
              </div>
            </div>

            <div class="stream-thumb-overlay">
              <div class="stream-overlay-top">
                <span [class]="stream.demoMode ? 'badge-demo' : 'badge-live'">
                  {{ stream.demoMode ? 'Demo' : 'En directo' }}
                </span>
                <span class="viewer-pill">
                  {{ stream.demoMode ? randomViewers(stream.slug) : (stream.currentViewers || 0) }}
                </span>
              </div>

              <div class="stream-overlay-bottom">
                <div class="stream-meta stream-meta-overlay">
                  <h3>{{ stream.creatorName }}</h3>
                  <p>{{ stream.title }}</p>
                </div>

                <div class="stream-metrics stream-metrics-overlay">
                  <div class="metric-chip">
                    <span class="metric-icon">V</span>
                    <span>{{ stream.demoMode ? randomViewers(stream.slug) : (stream.currentViewers || 0) }}</span>
                  </div>
                  <div class="metric-chip">
                    <span class="metric-icon">T</span>
                    <span>{{ primaryTag(stream.tags) }}</span>
                  </div>
                  <div class="metric-chip">
                    <span class="metric-icon">H</span>
                    <span>{{ loyaltyScore(stream.slug) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a>
      </section>
    </main>
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly streamsApi = inject(StreamsApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly displayStreams = signal<DisplayStream[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly realLiveCount = signal(0);
  readonly demoCount = signal(0);

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

  randomViewers(seed: string) {
    return (seed.length * 17) % 240 + 18;
  }

  primaryTag(tags: string[]) {
    return tags[0] ?? 'live';
  }

  loyaltyScore(seed: string) {
    return `${((seed.length * 13) % 35) + 65}%`;
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
    const liveStreams = streams.filter((stream) => stream.isLive);
    const demoSeed = liveStreams.length > 0 ? streams.filter((stream) => !stream.isLive) : streams;
    const palette = [
      'linear-gradient(135deg, rgba(255, 110, 128, 0.30), rgba(18, 168, 159, 0.35), rgba(16, 11, 24, 0.82))',
      'linear-gradient(135deg, rgba(255, 143, 115, 0.28), rgba(24, 168, 159, 0.30), rgba(18, 13, 29, 0.82))',
      'linear-gradient(135deg, rgba(123, 240, 219, 0.22), rgba(255, 107, 125, 0.28), rgba(12, 10, 20, 0.86))',
      'linear-gradient(135deg, rgba(24, 168, 159, 0.34), rgba(255, 107, 125, 0.20), rgba(11, 7, 18, 0.86))',
    ];

    const realCards: DisplayStream[] = liveStreams.map((stream, index) => ({
      ...stream,
      demoMode: false,
      accent: palette[index % palette.length],
      teaser: 'Live now',
      thumbnailSrc: this.resolveThumbnail(stream),
    }));

    const remaining = Math.max(25 - realCards.length, 0);
    const demoCards: DisplayStream[] = demoSeed.slice(0, remaining).map((stream, index) => ({
      ...stream,
      isLive: true,
      demoMode: true,
      accent: palette[(realCards.length + index) % palette.length],
      teaser: ['Spanish-first creator space', 'Private room preview', 'Fanclub energy', 'Late night lounge'][index % 4],
      thumbnailSrc: this.resolveThumbnail(stream),
    }));

    this.displayStreams.set([...realCards, ...demoCards]);
    this.realLiveCount.set(realCards.length);
    this.demoCount.set(demoCards.length);
  }

  private resolveThumbnail(stream: StreamSummary) {
    return stream.thumbnailUrl ?? VIRTUAL_MODEL_THUMBNAILS[stream.slug];
  }
}
