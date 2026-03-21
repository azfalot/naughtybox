import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
            <app-stream-player [src]="stream()!.playback.hlsUrl" [controls]="true" [muted]="false"></app-stream-player>
          </div>

          <div class="panel-card" style="margin-top: 18px;">
            <span [class]="stream()!.isLive ? 'badge-live' : 'badge-offline'">
              {{ stream()!.isLive ? 'En directo' : 'Offline' }}
            </span>
            <span class="viewer-pill" style="margin-left: 10px;">{{ stream()!.currentViewers || 0 }} viendo</span>
            <h1 style="margin-top: 14px;">{{ stream()!.title }}</h1>
            <p class="hero-copy">{{ stream()!.creatorName }} · {{ stream()!.description }}</p>
            <div class="creator-grid">
              <div>
                <p class="muted stat-label">Categoria</p>
                <strong>{{ stream()!.tags.join(' · ') || 'General' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Estado</p>
                <strong>{{ stream()!.isLive ? 'Emitiendo ahora' : 'Sin emision' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Acceso</p>
                <strong>Sala publica</strong>
              </div>
            </div>
          </div>

          <section class="panel-card" style="margin-top: 18px;">
            <h2 class="mini-title">Sobre la creadora</h2>
            <p class="muted">
              Perfil demo de fase 1. Aqui iremos mostrando bio, categorias, reglas de sala,
              objetivos y accesos a suscripcion cuando pasemos a las siguientes fases.
            </p>
          </section>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card chat-panel">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
              <span class="muted">beta</span>
            </div>

            <div class="chat-messages">
              <article class="chat-message" *ngFor="let message of messages">
                <strong>{{ message.author }}</strong>
                <p>{{ message.body }}</p>
              </article>
            </div>

            <form class="chat-form" (submit)="sendMessage($event)">
              <input
                #chatInput
                type="text"
                name="message"
                placeholder="Escribe un mensaje..."
              />
              <button type="submit">Enviar</button>
            </form>
          </section>

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
export class StreamPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly streamsApi = inject(StreamsApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly stream = signal<StreamDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly messages = [
    { author: 'Naughtybox', body: 'Chat demo listo para la siguiente fase.' },
    { author: 'Lucas', body: 'La sala ya se siente mucho mas a producto.' },
    { author: 'Ana', body: 'Falta integrar cuentas reales y moderacion.' },
  ];

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('Sala no valida.');
      this.loading.set(false);
      return;
    }

    try {
      await this.loadStream(slug);
      this.refreshTimer = setInterval(() => {
        void this.loadStream(slug, false);
      }, 8000);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la sala.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  sendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;

    if (!input || !input.value.trim()) {
      return;
    }

    this.messages.unshift({
      author: 'Tú',
      body: input.value.trim(),
    });
    input.value = '';
  }

  private async loadStream(slug: string, showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    const stream = await this.streamsApi.getStream(slug);
    this.stream.set(stream);
    this.error.set('');

    if (showLoader) {
      this.loading.set(false);
    }
  }
}
