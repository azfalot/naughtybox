import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatMessage, CreatorPublicProfile, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';
import { AuthApiService } from '../services/auth-api.service';
import { ChatApiService } from '../services/chat-api.service';
import { StreamsApiService } from '../services/streams-api.service';
import { WalletApiService } from '../services/wallet-api.service';
import { StreamChatPanelComponent } from './stream/stream-chat-panel.component';
import { StreamCreatorProfileComponent } from './stream/stream-creator-profile.component';

const DEFAULT_PROFILE: CreatorPublicProfile = {
  displayName: 'Creator',
  slug: 'creator',
  bio: 'Perfil publico pensado para combinar directo, biografia, tienda y contenido bajo demanda.',
  languages: [],
  categories: [],
  subcategories: [],
};

@Component({
  selector: 'app-stream-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent, StreamChatPanelComponent, StreamCreatorProfileComponent],
  template: `
    <main class="page page-wide">
      <a class="muted back-link" routerLink="/">Volver al listado</a>

      <section *ngIf="loading()" class="page-state">Cargando sala...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="stream()" class="stream-layout">
        <div>
          <div class="video-frame gated-frame">
            <app-stream-player
              *ngIf="canWatch()"
              [src]="stream()!.playback.hlsUrl"
              [controls]="true"
              [muted]="false"
            />

            <div *ngIf="!canWatch()" class="access-gate">
              <p class="eyebrow">Access</p>
              <h2 class="mini-title">{{ accessHeadline() }}</h2>
              <p class="muted">{{ accessCopy() }}</p>
              <div class="studio-actions">
                <button *ngIf="stream()!.viewerAccess?.accessMode !== 'public'" type="button" class="text-link" (click)="unlockPrivate()">
                  Desbloquear {{ stream()!.viewerAccess?.privateEntryTokens }} tokens
                </button>
                <button type="button" class="text-link" (click)="subscribe()">
                  Suscribirme {{ stream()!.viewerAccess?.memberMonthlyTokens }} tokens
                </button>
                <a *ngIf="!authApi.isAuthenticated()" class="text-link" routerLink="/login">Entrar</a>
              </div>
            </div>
          </div>

          <section class="panel-card room-summary room-summary-page">
            <div class="room-summary-head">
              <div class="room-summary-copy">
                <h1>{{ stream()!.title }}</h1>
                <p class="muted room-kicker">{{ stream()!.creatorName }} · {{ stream()!.description }}</p>
              </div>
              <div class="room-status-pills room-status-pills-compact">
                <span [class]="stream()!.isLive ? 'badge-live' : 'badge-offline'">{{ stream()!.isLive ? 'En directo' : 'Offline' }}</span>
                <span class="viewer-pill">{{ stream()!.currentViewers || 0 }} viendo</span>
                <span class="viewer-pill">{{ stream()!.accessMode || 'public' }}</span>
                <button type="button" class="action-button action-button-ghost" (click)="toggleFollow()">
                  {{ stream()!.following ? 'Siguiendo' : 'Seguir' }}
                </button>
                <a class="action-button action-button-warn" routerLink="/legal/18plus">Reportar</a>
              </div>
            </div>

            <div class="creator-grid creator-grid-tight">
              <div>
                <p class="muted stat-label">Categorias</p>
                <strong>{{ publicProfile().categories.join(' · ') || 'General' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Pais</p>
                <strong>{{ publicProfile().country || 'Sin definir' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Chat</p>
                <strong>{{ stream()!.viewerAccess?.chatMode || 'registered' }}</strong>
              </div>
            </div>
          </section>

          <app-stream-creator-profile [profile]="publicProfile()" />
        </div>

        <aside class="stream-sidebar">
          <app-stream-chat-panel
            [stream]="stream()"
            [messages]="messages()"
            [canChat]="canChat()"
            (sendMessage)="onSendMessage($event)"
            (unlock)="unlockPrivate()"
            (subscribe)="subscribe()"
          />

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
            <h2 class="mini-title">Acceso premium</h2>
            <ul class="helper-list">
              <li>Privado por tokens o membresia mensual.</li>
              <li>Chat configurable por nivel de acceso.</li>
              <li>Base preparada para ampliar a tippers, members y toys.</li>
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
  readonly messages = signal<ChatMessage[]>([]);
  readonly wallet = signal<WalletSummary | null>(null);
  readonly publicProfile = computed<CreatorPublicProfile>(() => this.stream()?.creatorProfile ?? DEFAULT_PROFILE);
  readonly canWatch = computed(() => this.stream()?.viewerAccess?.canWatch ?? true);
  readonly canChat = computed(() => this.stream()?.viewerAccess?.canChat ?? false);

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

  accessHeadline() {
    return this.stream()?.viewerAccess?.accessMode === 'private' ? 'Show privado' : 'Contenido premium';
  }

  accessCopy() {
    const access = this.stream()?.viewerAccess;
    if (!access) {
      return 'Necesitas acceso para entrar en esta sala.';
    }

    if (access.accessMode === 'private') {
      return `Desbloquea el directo por ${access.privateEntryTokens} tokens o suscribete por ${access.memberMonthlyTokens} tokens al mes.`;
    }

    return `Suscribete por ${access.memberMonthlyTokens} tokens al mes para ver y chatear con acceso premium.`;
  }

  async onSendMessage(body: string) {
    if (!this.stream() || !this.canChat()) {
      return;
    }

    this.chatApi.sendMessage(this.stream()!.slug, body);
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

  async toggleFollow() {
    if (!this.stream()) {
      return;
    }

    if (!this.authApi.isAuthenticated()) {
      this.notice.set('Entra con tu cuenta para seguir a este creador.');
      return;
    }

    try {
      const result = await this.streamsApi.toggleFollow(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, following: result.following } : current));
      this.notice.set(result.following ? 'Ahora sigues a este creador.' : 'Has dejado de seguir a este creador.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo actualizar el follow.');
    }
  }

  async unlockPrivate() {
    if (!this.stream()) {
      return;
    }

    try {
      const access = await this.streamsApi.unlockPrivate(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, viewerAccess: access } : current));
      await this.loadWallet();
      this.notice.set('Acceso privado desbloqueado.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo desbloquear el acceso.');
    }
  }

  async subscribe() {
    if (!this.stream()) {
      return;
    }

    try {
      const access = await this.streamsApi.subscribe(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, viewerAccess: access } : current));
      await this.loadWallet();
      this.notice.set('Membresia activada.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo activar la membresia.');
    }
  }

  private async loadStream(slug: string, showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    this.stream.set(await this.streamsApi.getStream(slug));
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
