import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamSummary } from '@naughtybox/shared-types';
import { StreamsApiService } from '../services/streams-api.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page">
      <section class="hero-card">
        <p class="eyebrow">Naughtybox Phase 1</p>
        <h1 class="hero-title">Streaming moderno para pruebas reales con OBS.</h1>
        <p class="hero-copy">
          Esta primera fase valida el flujo completo de emision publica: una creadora
          publica con OBS en MediaMTX y los viewers consumen la señal en navegador via HLS.
        </p>
      </section>

      <h2 class="section-title">Salas disponibles</h2>

      <section *ngIf="loading()" class="page-state">Cargando salas...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="!loading() && !error()" class="stream-grid">
        <article class="hero-card stream-card" *ngFor="let stream of streams()">
          <div class="stream-thumb">
            <span [class]="stream.isLive ? 'badge-live' : 'badge-offline'">
              {{ stream.isLive ? 'En directo' : 'Offline' }}
            </span>
          </div>

          <div class="stream-meta">
            <h3>{{ stream.title }}</h3>
            <p>{{ stream.creatorName }} · {{ stream.description }}</p>
            <p class="muted">Tags: {{ stream.tags.join(', ') || 'sin etiquetas' }}</p>
          </div>

          <a class="stream-link" [routerLink]="['/streams', stream.slug]">Abrir sala</a>
        </article>
      </section>
    </main>
  `,
})
export class HomePageComponent implements OnInit {
  private readonly streamsApi = inject(StreamsApiService);

  readonly streams = signal<StreamSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit() {
    try {
      const streams = await this.streamsApi.listStreams();
      this.streams.set(streams);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el catalogo.');
    } finally {
      this.loading.set(false);
    }
  }
}
