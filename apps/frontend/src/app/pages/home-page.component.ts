import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamsApiService } from '../services/streams-api.service';
import { StreamPlayerComponent } from '../stream-player.component';

type DisplayStream = StreamSummary & {
  accent: string;
  thumbnailSrc?: string;
};

const THUMBNAILS: Record<string, string> = {
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
          <h1 class="lobby-title">Salas reales, sin relleno.</h1>
        </div>

        <div class="lobby-stats">
          <div class="lobby-stat panel-card">
            <strong>{{ liveCount() }}</strong>
            <span>online</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ offlineCount() }}</strong>
            <span>offline</span>
          </div>
          <div class="lobby-stat panel-card">
            <strong>{{ displayStreams().length }}</strong>
            <span>totales</span>
          </div>
        </div>
      </section>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error() && displayStreams().length === 0" class="page-state">
        Todavia no hay salas creadas.
      </section>

      <section *ngIf="!loading() && !error() && displayStreams().length > 0" class="stream-grid stream-grid-compact">
        <a
          class="stream-card panel-card stream-card-link"
          *ngFor="let stream of displayStreams()"
          [routerLink]="['/streams', stream.slug]"
          [attr.aria-label]="'Entrar en la sala de ' + stream.creatorName"
        >
          <div class="stream-thumb stream-thumb-player">
            <app-stream-player
              *ngIf="stream.isLive"
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />

            <div *ngIf="!stream.isLive" class="mock-preview" [style.background]="stream.accent">
              <img
                *ngIf="stream.thumbnailSrc"
                class="mock-preview-image"
                [src]="stream.thumbnailSrc"
                [alt]="'Preview de ' + stream.creatorName"
              />
              <div class="mock-preview-copy">
                <strong>{{ stream.creatorName }}</strong>
                <span>{{ stream.description }}</span>
              </div>
            </div>

            <div class="stream-thumb-overlay">
              <div class="stream-overlay-top">
                <span [class]="stream.isLive ? 'badge-live' : 'badge-offline'">
                  {{ stream.isLive ? 'Live' : 'Offline' }}
                </span>
                <span class="viewer-pill">{{ stream.currentViewers || 0 }}</span>
              </div>

              <div class="stream-overlay-bottom">
                <div class="stream-meta stream-meta-overlay">
                  <h3>{{ stream.creatorName }}</h3>
                  <p>{{ stream.title }}</p>
                </div>

                <div class="stream-metrics stream-metrics-overlay">
                  <div class="metric-chip">
                    <span class="metric-icon">V</span>
                    <span>{{ stream.currentViewers || 0 }}</span>
                  </div>
                  <div class="metric-chip">
                    <span class="metric-icon">T</span>
                    <span>{{ primaryTag(stream.tags) }}</span>
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
  readonly liveCount = signal(0);
  readonly offlineCount = signal(0);

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

  primaryTag(tags: string[]) {
    return tags[0] ?? 'general';
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
    const palette = [
      'linear-gradient(135deg, rgba(255, 110, 128, 0.30), rgba(255, 147, 109, 0.24), rgba(16, 11, 24, 0.82))',
      'linear-gradient(135deg, rgba(255, 143, 115, 0.28), rgba(255, 91, 115, 0.24), rgba(18, 13, 29, 0.82))',
      'linear-gradient(135deg, rgba(255, 207, 191, 0.18), rgba(255, 91, 115, 0.24), rgba(12, 10, 20, 0.86))',
    ];

    const cards = streams.map((stream, index) => ({
      ...stream,
      accent: palette[index % palette.length],
      thumbnailSrc: stream.thumbnailUrl ?? THUMBNAILS[stream.slug],
    }));

    this.displayStreams.set(cards);
    this.liveCount.set(cards.filter((stream) => stream.isLive).length);
    this.offlineCount.set(cards.filter((stream) => !stream.isLive).length);
  }
}
