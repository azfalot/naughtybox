import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatMessage, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { AuthApiService } from '../services/auth-api.service';
import { ChatApiService } from '../services/chat-api.service';
import { StreamsApiService } from '../services/streams-api.service';
import { WalletApiService } from '../services/wallet-api.service';

type VirtualCreatorProfile = {
  avatar: string;
  headline: string;
  bio: string;
};

const DEFAULT_PROFILE: VirtualCreatorProfile = {
  avatar: '/assets/models/sara-bloom.svg',
  headline: 'Creator-first live room',
  bio: 'Perfil virtual de referencia para validar branding, tono visual y estructura de la sala.',
};

const VIRTUAL_CREATOR_PROFILES: Record<string, VirtualCreatorProfile> = {
  'sara-night-show': {
    avatar: '/assets/models/sara-bloom.svg',
    headline: 'Streaming nocturno premium',
    bio: 'Sara Bloom es una creadora virtual ficticia pensada para validar la identidad visual de Naughtybox: cercana, elegante y claramente adulta.',
  },
};

@Component({
  selector: 'app-stream-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page page-wide">
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
                <p class="muted stat-label">Chat</p>
                <strong>{{ authApi.isAuthenticated() ? 'realtime' : 'login requerido' }}</strong>
              </div>
            </div>
          </div>

          <section class="panel-card" style="margin-top: 18px;">
            <h2 class="mini-title">Sobre la creadora</h2>
            <div class="creator-profile">
              <img
                class="creator-avatar"
                [src]="creatorProfile().avatar"
                [alt]="'Avatar virtual de ' + stream()!.creatorName"
              />
              <div>
                <strong>{{ creatorProfile().headline }}</strong>
                <p class="muted">{{ creatorProfile().bio }}</p>
              </div>
            </div>
          </section>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card chat-panel">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
              <span class="muted">{{ authApi.isAuthenticated() ? 'realtime' : 'privado' }}</span>
            </div>

            <div class="chat-messages">
              <article class="chat-message" *ngFor="let message of messages()">
                <strong>{{ message.authorName }}</strong>
                <p>{{ message.body }}</p>
              </article>
            </div>

            <form *ngIf="authApi.isAuthenticated(); else loginForChat" class="chat-form" (submit)="sendMessage($event)">
              <input
                type="text"
                name="message"
                placeholder="Escribe un mensaje..."
              />
              <button type="submit">Enviar</button>
            </form>

            <ng-template #loginForChat>
              <div class="chat-locked">
                <p class="muted">El chat queda reservado a usuarios registrados para moderacion, seguridad y capa premium.</p>
                <a class="text-link" routerLink="/login">Entrar para chatear</a>
              </div>
            </ng-template>
          </section>

          <section class="panel-card" *ngIf="authApi.isAuthenticated()">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Wallet</h2>
              <span class="viewer-pill">{{ wallet()?.balance ?? 0 }} tokens</span>
            </div>

            <div class="studio-actions" style="margin-top: 12px;">
              <button type="button" class="text-link" (click)="addDevCredit()">Recarga dev +250</button>
              <button type="button" class="text-link" (click)="tip(25)">Tip 25</button>
              <button type="button" class="text-link" (click)="tip(100)">Tip 100</button>
            </div>

            <ul class="helper-list" style="margin-top: 14px;" *ngIf="wallet()?.recentTransactions?.length">
              <li *ngFor="let transaction of wallet()!.recentTransactions.slice(0, 5)">
                {{ transaction.type }} · {{ transaction.amount }} · {{ transaction.balanceAfter }}
              </li>
            </ul>
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

          <p *ngIf="notice()" class="studio-notice">{{ notice() }}</p>
        </aside>
      </section>
    </main>
  `,
})
export class StreamPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly streamsApi = inject(StreamsApiService);
  readonly authApi = inject(AuthApiService);
  private readonly walletApi = inject(WalletApiService);
  private readonly chatApi = inject(ChatApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly stream = signal<StreamDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly creatorProfile = signal<VirtualCreatorProfile>(DEFAULT_PROFILE);
  readonly messages = signal<ChatMessage[]>([]);
  readonly wallet = signal<WalletSummary | null>(null);

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('Sala no valida.');
      this.loading.set(false);
      return;
    }

    try {
      await this.loadStream(slug);
      await this.loadChat(slug);
      if (this.authApi.isAuthenticated()) {
        await this.loadWallet();
        this.connectChat(slug);
      }
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
    this.chatApi.disconnect();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;

    if (!input || !input.value.trim() || !this.stream()) {
      return;
    }

    this.chatApi.sendMessage(this.stream()!.slug, input.value.trim());
    input.value = '';
  }

  async addDevCredit() {
    try {
      this.wallet.set(await this.walletApi.addDevCredit());
      this.notice.set('Saldo de prueba recargado.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo recargar.');
    }
  }

  async tip(amount: number) {
    if (!this.stream()) {
      return;
    }

    try {
      this.wallet.set(await this.walletApi.tipCreator(this.stream()!.slug, amount));
      this.notice.set(`Propina enviada: ${amount} tokens.`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo enviar la propina.');
    }
  }

  private async loadStream(slug: string, showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    const stream = await this.streamsApi.getStream(slug);
    this.stream.set(stream);
    this.creatorProfile.set(VIRTUAL_CREATOR_PROFILES[slug] ?? DEFAULT_PROFILE);
    this.error.set('');

    if (showLoader) {
      this.loading.set(false);
    }
  }

  private async loadChat(slug: string) {
    this.messages.set(await this.chatApi.getHistory(slug));
  }

  private async loadWallet() {
    this.wallet.set(await this.walletApi.getWallet());
  }

  private connectChat(slug: string) {
    this.chatApi.connect(slug, {
      onHistory: (messages) => this.messages.set(messages),
      onMessage: (message) => {
        this.messages.update((current) => [...current, message].slice(-40));
      },
    });
  }
}
