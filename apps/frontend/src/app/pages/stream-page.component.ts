import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatMessage, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { AuthApiService } from '../services/auth-api.service';
import { ChatApiService } from '../services/chat-api.service';
import { StreamsApiService } from '../services/streams-api.service';
import { WalletApiService } from '../services/wallet-api.service';

type CreatorSummary = {
  headline: string;
  bio: string;
};

const DEFAULT_PROFILE: CreatorSummary = {
  headline: 'Live room',
  bio: 'Sala pública pensada para emitir, conversar y validar la experiencia principal del producto con una lectura más limpia.',
};

const CREATOR_PROFILES: Record<string, CreatorSummary> = {
  'luna-en-directo': {
    headline: 'Sala orientada a catálogo',
    bio: 'Luna representa un perfil directo: foco total en el vídeo, chat lateral y una biografía sobria para no romper la jerarquía visual.',
  },
  'jade-after-hours': {
    headline: 'Sesión nocturna',
    bio: 'Jade sirve como referencia para validar una sala algo más editorial, manteniendo el vídeo protagonista y los datos secundarios contenidos.',
  },
};

@Component({
  selector: 'app-stream-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <main class="page page-wide">
      <a class="muted back-link" routerLink="/">Volver al listado</a>

      <section *ngIf="loading()" class="page-state">Cargando sala...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="stream()" class="stream-layout">
        <div>
          <div class="video-frame">
            <app-stream-player [src]="stream()!.playback.hlsUrl" [controls]="true" [muted]="false"></app-stream-player>
          </div>

          <section class="panel-card room-summary room-summary-page">
            <div class="room-summary-head">
              <div>
                <h1>{{ stream()!.title }}</h1>
                <p class="muted">{{ stream()!.creatorName }} · {{ stream()!.description }}</p>
              </div>
              <div class="room-status-pills">
                <span [class]="stream()!.isLive ? 'badge-live' : 'badge-offline'">
                  {{ stream()!.isLive ? 'En directo' : 'Offline' }}
                </span>
                <span class="viewer-pill">{{ stream()!.currentViewers || 0 }} viendo</span>
              </div>
            </div>

            <div class="creator-grid creator-grid-tight">
              <div>
                <p class="muted stat-label">Categorias</p>
                <strong>{{ stream()!.tags.join(' · ') || 'General' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Estado</p>
                <strong>{{ stream()!.isLive ? 'Emitiendo ahora' : 'Sin emision' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Acceso al chat</p>
                <strong>{{ authApi.isAuthenticated() ? 'Usuarios registrados' : 'Requiere login' }}</strong>
              </div>
            </div>
          </section>

          <section class="panel-card room-summary">
            <h2 class="mini-title">Sobre la creadora</h2>
            <strong>{{ creatorSummary().headline }}</strong>
            <p class="muted room-bio">{{ creatorSummary().bio }}</p>
          </section>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card chat-panel">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
              <span class="muted">{{ authApi.isAuthenticated() ? 'Realtime' : 'Privado' }}</span>
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
                <p class="muted">El chat queda reservado a usuarios registrados para moderacion y seguridad.</p>
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
  readonly creatorSummary = signal<CreatorSummary>(DEFAULT_PROFILE);
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
    this.creatorSummary.set(CREATOR_PROFILES[slug] ?? DEFAULT_PROFILE);
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
