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
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page">
      <section class="page-intro">
        <div>
          <p class="eyebrow">Streaming lobby</p>
          <h1 class="intro-title">25 salas para sentir la plataforma antes de tener trafico real.</h1>
        </div>
        <p class="hero-copy">
          Cuando no hay suficientes directos reales, Naughtybox entra en modo demo y rellena
          el grid con salas simuladas para validar identidad visual, densidad y navegacion.
        </p>
      </section>

      <div class="section-row">
        <h2 class="section-title">Salas online</h2>
        <p class="muted">{{ realLiveCount() }} real(es) · {{ demoCount() }} demo</p>
      </div>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error()" class="stream-grid">
        <article class="stream-card panel-card" *ngFor="let stream of displayStreams()">
          <div class="stream-thumb stream-thumb-player">
            <app-stream-player
              *ngIf="!stream.demoMode && stream.isLive"
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />
            <div *ngIf="stream.demoMode || !stream.isLive" class="mock-preview" [style.background]="stream.accent">
              <div class="mock-preview-copy">
                <strong>{{ stream.creatorName }}</strong>
                <span>{{ stream.teaser }}</span>
              </div>
            </div>
            <div class="stream-thumb-overlay">
              <span [class]="stream.demoMode ? 'badge-demo' : 'badge-live'">
                {{ stream.demoMode ? 'Demo' : 'En directo' }}
              </span>
              <span class="viewer-pill">{{ stream.demoMode ? randomViewers(stream.slug) : (stream.currentViewers || 0) }} viendo</span>
            </div>
          </div>

          <div class="stream-meta">
            <h3>{{ stream.title }}</h3>
            <p>{{ stream.creatorName }}</p>
            <p class="muted">Tags: {{ stream.tags.join(', ') || 'sin etiquetas' }}</p>
          </div>

          <a class="stream-link" [routerLink]="['/streams', stream.slug]">Abrir sala</a>
        </article>
      </section>
    </main>
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly streamsApi = inject(StreamsApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly streams = signal<StreamSummary[]>([]);
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

  private async loadStreams(showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    try {
      const streams = await this.streamsApi.listStreams();
      this.streams.set(streams);
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

  randomViewers(seed: string) {
    return (seed.length * 17) % 240 + 18;
  }

  private populateDisplayStreams(streams: StreamSummary[]) {
    const liveStreams = streams.filter((stream) => stream.isLive);
    const demoSeed = liveStreams.length > 0 ? streams.filter((stream) => !stream.isLive) : streams;
    const palette = [
      'linear-gradient(135deg, rgba(18, 140, 126, 0.95), rgba(5, 27, 33, 0.7))',
      'linear-gradient(135deg, rgba(22, 110, 120, 0.95), rgba(9, 19, 28, 0.75))',
      'linear-gradient(135deg, rgba(9, 95, 109, 0.96), rgba(12, 38, 44, 0.75))',
      'linear-gradient(135deg, rgba(27, 129, 142, 0.95), rgba(8, 23, 31, 0.8))',
    ];

    const realCards: DisplayStream[] = liveStreams.map((stream, index) => ({
      ...stream,
      demoMode: false,
      accent: palette[index % palette.length],
      teaser: 'Live now',
    }));

    const remaining = Math.max(25 - realCards.length, 0);
    const demoCards: DisplayStream[] = demoSeed.slice(0, remaining).map((stream, index) => ({
      ...stream,
      isLive: true,
      demoMode: true,
      accent: palette[(realCards.length + index) % palette.length],
      teaser: ['Spanish-first creator space', 'Private room preview', 'Fanclub energy', 'Dark teal lounge'][index % 4],
    }));

    this.displayStreams.set([...realCards, ...demoCards]);
    this.realLiveCount.set(realCards.length);
    this.demoCount.set(demoCards.length);
  }
}
