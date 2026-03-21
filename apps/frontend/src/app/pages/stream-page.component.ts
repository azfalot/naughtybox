import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StreamDetails } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { StreamsApiService } from '../services/streams-api.service';

@Component({
  selector: 'app-stream-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page">
      <a class="muted" routerLink="/">← Volver al listado</a>

      <section *ngIf="loading()" class="page-state">Cargando stream...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="stream()" class="stream-layout">
        <div>
          <div class="video-frame">
            <app-stream-player [src]="stream()!.playback.hlsUrl"></app-stream-player>
          </div>

          <div class="panel-card" style="margin-top: 18px;">
            <span [class]="stream()!.isLive ? 'badge-live' : 'badge-offline'">
              {{ stream()!.isLive ? 'En directo' : 'Offline' }}
            </span>
            <h1 style="margin-top: 14px;">{{ stream()!.title }}</h1>
            <p class="hero-copy">{{ stream()!.creatorName }} · {{ stream()!.description }}</p>
            <p class="muted">Ruta HLS: {{ stream()!.playback.hlsUrl }}</p>
          </div>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card">
            <h2 class="mini-title">Configurar OBS</h2>
            <div class="helper-list">
              <p class="muted">Servidor RTMP</p>
              <span class="inline-code">{{ stream()!.publish.obsServer }}</span>
              <p class="muted" style="margin-top: 14px;">Stream key</p>
              <span class="inline-code">{{ stream()!.publish.streamKey }}</span>
            </div>
          </section>

          <section class="panel-card">
            <h2 class="mini-title">Checklist de prueba</h2>
            <ul class="helper-list">
              <li>Abrir OBS y configurar el servidor RTMP.</li>
              <li>Usar la stream key exacta de esta sala.</li>
              <li>Iniciar emision y recargar la pagina si el stream tarda unos segundos.</li>
              <li>Validar reproduccion desde otra pestaña o dispositivo.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  `,
})
export class StreamPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly streamsApi = inject(StreamsApiService);

  readonly stream = signal<StreamDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('Sala no valida.');
      this.loading.set(false);
      return;
    }

    try {
      const stream = await this.streamsApi.getStream(slug);
      this.stream.set(stream);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la sala.');
    } finally {
      this.loading.set(false);
    }
  }
}
