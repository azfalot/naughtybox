import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamsApiService } from '../services/streams-api.service';
import { StreamPlayerComponent } from '../stream-player.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page">
      <section class="hero-card">
        <p class="eyebrow">Naughtybox en directo</p>
        <h1 class="hero-title">Salas online, acceso rapido y experiencia de cam moderna.</h1>
        <p class="hero-copy">
          Mostramos solo creadoras online. Cada card abre su sala dedicada con video,
          chat lateral e informacion del perfil para validar la experiencia real del producto.
        </p>
      </section>

      <div class="section-row">
        <h2 class="section-title">Salas online</h2>
        <p class="muted">{{ streams().length }} activa(s) ahora</p>
      </div>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error() && streams().length === 0" class="page-state">
        Ahora mismo no hay ninguna creadora en directo. Deja OBS emitiendo y esta
        portada se actualizara sola.
      </section>

      <section *ngIf="!loading() && !error() && streams().length > 0" class="stream-grid">
        <article class="hero-card stream-card" *ngFor="let stream of streams()">
          <div class="stream-thumb stream-thumb-player">
            <app-stream-player
              [src]="stream.playbackHlsUrl"
              [controls]="false"
              [muted]="true"
            />
            <div class="stream-thumb-overlay">
              <span class="badge-live">En directo</span>
              <span class="viewer-pill">{{ stream.currentViewers || 0 }} viendo</span>
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
  readonly loading = signal(true);
  readonly error = signal('');

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
      this.streams.set(streams.filter((stream) => stream.isLive));
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el catalogo.');
    } finally {
      if (showLoader) {
        this.loading.set(false);
      }
    }
  }
}
