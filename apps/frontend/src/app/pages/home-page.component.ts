import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ChatMessage, StreamDetails, StreamSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { ChatApiService } from '../services/chat-api.service';
import { StreamsApiService } from '../services/streams-api.service';

type DisplayStream = StreamSummary & {
  accent: string;
  thumbnailSrc?: string;
};

type CreatorPreview = {
  avatar: string;
  headline: string;
  bio: string;
};

const THUMBNAILS: Record<string, string> = {
  'sara-night-show': '/assets/models/sara-bloom.svg',
};

const CREATOR_PREVIEWS: Record<string, CreatorPreview> = {
  'sara-night-show': {
    avatar: '/assets/models/sara-bloom.svg',
    headline: 'Room preview premium',
    bio: 'Sara Bloom presenta un perfil de ejemplo más editorial, con tono cercano, bloques compactos y una biografía larga para validar cómo respira la sala cuando una creadora quiere contar más sobre sí misma, sus horarios, sus reglas y su estilo.',
  },
  'luna-en-directo': {
    avatar: '/assets/models/sara-bloom.svg',
    headline: 'Sala orientada a catálogo',
    bio: 'Luna representa un perfil más directo: menos texto comercial, información clara y foco total en el vídeo, el chat y la acción principal de la sala.',
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
          <h1 class="lobby-title">Salas en directo y catálogo.</h1>
          <p class="muted lobby-subtitle">Catálogo compacto, lectura rápida y entrada en modal sin romper el flujo.</p>
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
            <span>salas</span>
          </div>
        </div>
      </section>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error() && displayStreams().length === 0" class="page-state">
        Todavía no hay salas creadas.
      </section>

      <section *ngIf="!loading() && !error() && displayStreams().length > 0" class="catalog-grid">
        <button
          type="button"
          class="catalog-card panel-card"
          *ngFor="let stream of displayStreams()"
          (click)="openRoom(stream)"
        >
          <div class="catalog-thumb">
            <app-stream-player
              *ngIf="stream.isLive"
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />

            <div *ngIf="!stream.isLive" class="catalog-preview" [style.background]="stream.accent">
              <img
                *ngIf="stream.thumbnailSrc"
                class="catalog-preview-image"
                [src]="stream.thumbnailSrc"
                [alt]="'Preview de ' + stream.creatorName"
              />
            </div>

            <div class="catalog-status-row">
              <span [class]="stream.isLive ? 'badge-live' : 'badge-offline'">
                {{ stream.isLive ? 'Live' : 'Offline' }}
              </span>
              <span class="viewer-pill">{{ stream.currentViewers || 0 }}</span>
            </div>
          </div>

          <div class="catalog-body">
            <div class="catalog-copy">
              <strong>{{ stream.creatorName }}</strong>
              <span>{{ stream.title }}</span>
            </div>
            <div class="catalog-meta">
              <span>{{ primaryTag(stream.tags) }}</span>
              <span>{{ secondaryTag(stream.tags) }}</span>
            </div>
          </div>
        </button>
      </section>

      <div *ngIf="selectedStream()" class="modal-backdrop" (click)="closeRoom()">
        <section class="room-modal panel-card" (click)="$event.stopPropagation()">
          <header class="room-modal-header">
            <div>
              <p class="eyebrow">Room Preview</p>
              <h2>{{ selectedStream()!.creatorName }}</h2>
            </div>
            <button type="button" class="icon-button" (click)="closeRoom()">Cerrar</button>
          </header>

          <section *ngIf="modalLoading()" class="page-state page-state-modal">Cargando sala...</section>

          <div *ngIf="!modalLoading()" class="room-modal-layout">
            <div>
              <div class="video-frame video-frame-modal">
                <app-stream-player
                  *ngIf="selectedStream()!.isLive"
                  [src]="selectedStream()!.playback.hlsUrl"
                  [controls]="true"
                  [muted]="false"
                />

                <div *ngIf="!selectedStream()!.isLive" class="modal-preview" [style.background]="selectedAccent()">
                  <img
                    *ngIf="selectedPreview().avatar"
                    class="catalog-preview-image"
                    [src]="selectedPreview().avatar"
                    [alt]="'Preview de ' + selectedStream()!.creatorName"
                  />
                </div>
              </div>

              <section class="panel-card room-summary">
                <div class="room-summary-head">
                  <div>
                    <h3>{{ selectedStream()!.title }}</h3>
                    <p class="muted">{{ selectedPreview().headline }}</p>
                  </div>
                  <span [class]="selectedStream()!.isLive ? 'badge-live' : 'badge-offline'">
                    {{ selectedStream()!.isLive ? 'En directo' : 'Offline' }}
                  </span>
                </div>
                <p class="room-bio">{{ selectedPreview().bio }}</p>
                <div class="creator-grid creator-grid-tight">
                  <div>
                    <p class="muted stat-label">Tags</p>
                    <strong>{{ selectedStream()!.tags.join(' · ') || 'general' }}</strong>
                  </div>
                  <div>
                    <p class="muted stat-label">Viewers</p>
                    <strong>{{ selectedStream()!.currentViewers || 0 }}</strong>
                  </div>
                  <div>
                    <p class="muted stat-label">Estado</p>
                    <strong>{{ selectedStream()!.isLive ? 'online' : 'offline' }}</strong>
                  </div>
                </div>
              </section>
            </div>

            <aside class="room-modal-sidebar">
              <section class="panel-card room-chat-preview">
                <h3 class="mini-title">Chat</h3>
                <div class="chat-messages compact-chat">
                  <article class="chat-message" *ngFor="let message of selectedMessages()">
                    <strong>{{ message.authorName }}</strong>
                    <p>{{ message.body }}</p>
                  </article>
                  <p *ngIf="selectedMessages().length === 0" class="muted">Aún no hay mensajes en esta sala.</p>
                </div>
              </section>

              <section class="panel-card room-tech">
                <h3 class="mini-title">Sala</h3>
                <div class="helper-list">
                  <p class="muted">Slug</p>
                  <span class="inline-code">{{ selectedStream()!.slug }}</span>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly streamsApi = inject(StreamsApiService);
  private readonly chatApi = inject(ChatApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly displayStreams = signal<DisplayStream[]>([]);
  readonly selectedStream = signal<StreamDetails | null>(null);
  readonly selectedMessages = signal<ChatMessage[]>([]);
  readonly loading = signal(true);
  readonly modalLoading = signal(false);
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

  secondaryTag(tags: string[]) {
    return tags[1] ?? 'catálogo';
  }

  selectedPreview() {
    const stream = this.selectedStream();
    if (!stream) {
      return {
        avatar: '',
        headline: '',
        bio: '',
      };
    }

    return (
      CREATOR_PREVIEWS[stream.slug] ?? {
        avatar: THUMBNAILS[stream.slug] ?? '',
        headline: 'Preview de sala',
        bio: `${stream.creatorName} usa esta sala para validar una lectura más limpia: vídeo protagonista, chat contenido y una biografía larga para comprobar jerarquía, espaciado y densidad de información sin ruido visual.`,
      }
    );
  }

  selectedAccent() {
    const stream = this.selectedStream();
    const display = this.displayStreams().find((candidate) => candidate.slug === stream?.slug);
    return (
      display?.accent ??
      'linear-gradient(135deg, rgba(255, 110, 128, 0.30), rgba(255, 147, 109, 0.24), rgba(16, 11, 24, 0.82))'
    );
  }

  async openRoom(stream: DisplayStream) {
    this.modalLoading.set(true);
    try {
      const [details, messages] = await Promise.all([
        this.streamsApi.getStream(stream.slug),
        this.chatApi.getHistory(stream.slug),
      ]);
      this.selectedStream.set(details);
      this.selectedMessages.set(messages);
    } finally {
      this.modalLoading.set(false);
    }
  }

  closeRoom() {
    this.selectedStream.set(null);
    this.selectedMessages.set([]);
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
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      if (showLoader) {
        this.loading.set(false);
      }
    }
  }

  private populateDisplayStreams(streams: StreamSummary[]) {
    const palette = [
      'linear-gradient(135deg, rgba(255, 110, 128, 0.22), rgba(255, 147, 109, 0.18), rgba(16, 11, 24, 0.92))',
      'linear-gradient(135deg, rgba(255, 143, 115, 0.20), rgba(255, 91, 115, 0.18), rgba(18, 13, 29, 0.92))',
      'linear-gradient(135deg, rgba(255, 207, 191, 0.16), rgba(255, 91, 115, 0.18), rgba(12, 10, 20, 0.94))',
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
