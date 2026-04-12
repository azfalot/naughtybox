import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatMessage, CreatorPublicProfile, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
import { CreatorAvatarComponent } from '../creator-avatar.component';
import { RoomAccessGateComponent } from '../room-access-gate.component';
import { StreamPlayerComponent } from '../stream-player.component';
import { AuthApiService } from '../services/auth-api.service';
import { ChatApiService } from '../services/chat-api.service';
import { StreamsApiService } from '../services/streams-api.service';
import { WalletApiService } from '../services/wallet-api.service';

type MediaPreview = {
  title: string;
  type: 'free' | 'premium' | 'store';
  price?: string;
};

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
  imports: [CommonModule, RouterLink, StreamPlayerComponent, RoomAccessGateComponent, CreatorAvatarComponent],
  template: `
    <main class="page page-wide">
      <a class="muted back-link" routerLink="/">Volver al listado</a>

      <section *ngIf="loading()" class="page-state">Cargando sala...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="stream()" class="stream-layout">
        <div>
          <!-- Video frame with live glow when streaming -->
          <div class="video-frame gated-frame" [class.video-frame-live]="stream()!.isLive && canWatch()">
            <app-stream-player
              *ngIf="canWatch()"
              [src]="stream()!.playback.hlsUrl"
              [controls]="true"
              [muted]="false"
            />

            <app-room-access-gate
              *ngIf="!canWatch()"
              [eyebrow]="accessEyebrow()"
              [headline]="accessHeadline()"
              [copy]="accessCopy()"
              [privateTokens]="stream()!.viewerAccess?.privateEntryTokens"
              [memberTokens]="stream()!.viewerAccess?.memberMonthlyTokens"
              [isAuthenticated]="authApi.isAuthenticated()"
              [canUnlock]="stream()!.viewerAccess?.accessMode === 'private'"
              (unlockClicked)="unlockPrivate()"
              (subscribeClicked)="subscribe()"
            />
          </div>

          <!-- Creator bar: avatar + title + status + actions -->
          <div class="room-creator-bar panel-card">
            <app-creator-avatar
              [name]="publicProfile().displayName"
              size="lg"
              [isLive]="stream()!.isLive"
            />
            <div class="room-creator-info">
              <div class="room-creator-headline">
                <h1 class="room-creator-title">{{ stream()!.title }}</h1>
                <div class="room-status-pills">
                  <span [class]="stream()!.isLive ? 'badge-live' : 'badge-offline'">
                    {{ stream()!.isLive ? '● En directo' : 'Offline' }}
                  </span>
                  <span class="viewer-pill">{{ stream()!.currentViewers || 0 }} viendo</span>
                  <span class="viewer-pill room-access-badge room-access-badge-{{ stream()!.accessMode || 'public' }}">
                    {{ stream()!.accessMode || 'public' }}
                  </span>
                </div>
              </div>
              <p class="muted room-creator-kicker">
                {{ publicProfile().displayName }}
                <span *ngIf="stream()!.description"> &middot; {{ stream()!.description }}</span>
              </p>
              <div class="room-creator-meta">
                <span class="room-meta-chip" *ngIf="publicProfile().categories.length">
                  {{ publicProfile().categories.slice(0, 2).join(' · ') }}
                </span>
                <span class="room-meta-chip" *ngIf="publicProfile().country">
                  {{ publicProfile().country }}
                </span>
                <span class="room-meta-chip">
                  Chat: {{ stream()!.viewerAccess?.chatMode || 'registered' }}
                </span>
              </div>
            </div>
            <div class="room-creator-actions">
              <button type="button" class="action-button action-button-follow" [class.action-button-following]="stream()!.following" (click)="toggleFollow()">
                {{ stream()!.following ? '✓ Siguiendo' : '+ Seguir' }}
              </button>
              <a class="action-button action-button-report" routerLink="/legal/18plus">Reportar</a>
            </div>
          </div>

          <!-- Profile hero -->
          <section class="panel-card profile-hero profile-hero-room" [style.background]="coverStyle()">
            <div class="profile-hero-copy profile-hero-copy-tight">
              <p class="eyebrow">Perfil</p>
              <h2>{{ publicProfile().displayName }}</h2>
              <p class="muted profile-hero-bio">{{ publicProfile().bio }}</p>
              <div class="social-links-grid social-links-grid-tight" *ngIf="hasSocialLinks()">
                <a *ngIf="publicProfile().instagramUrl" class="social-link-card social-link-card-mini" [href]="publicProfile().instagramUrl" target="_blank" rel="noreferrer"><span class="social-icon">IG</span><span>Instagram</span></a>
                <a *ngIf="publicProfile().xUrl" class="social-link-card social-link-card-mini" [href]="publicProfile().xUrl" target="_blank" rel="noreferrer"><span class="social-icon">X</span><span>X</span></a>
                <a *ngIf="publicProfile().onlyFansUrl" class="social-link-card social-link-card-mini" [href]="publicProfile().onlyFansUrl" target="_blank" rel="noreferrer"><span class="social-icon">OF</span><span>OnlyFans</span></a>
                <a *ngIf="publicProfile().websiteUrl" class="social-link-card social-link-card-mini" [href]="publicProfile().websiteUrl" target="_blank" rel="noreferrer"><span class="social-icon">WEB</span><span>Web</span></a>
              </div>
            </div>

            <div class="profile-stats">
              <div class="profile-stat-box">
                <strong>{{ followersCount() }}</strong>
                <span>Followers</span>
              </div>
              <div class="profile-stat-box">
                <strong>{{ profileViewsCount() }}</strong>
                <span>Visibilidad</span>
              </div>
              <div class="profile-stat-box">
                <strong>#{{ rankingScore() }}</strong>
                <span>Ranking</span>
              </div>
            </div>
          </section>

          <!-- About + facts -->
          <section class="panel-card profile-section">
            <div class="profile-section-grid">
              <div>
                <h3 class="mini-title">Acerca de {{ publicProfile().displayName }}</h3>
                <p class="muted room-bio">{{ publicProfile().bio }}</p>
              </div>
              <div class="profile-facts">
                <div><span class="muted">Edad</span><strong>{{ publicProfile().age || '-' }}</strong></div>
                <div><span class="muted">Genero</span><strong>{{ publicProfile().gender || '-' }}</strong></div>
                <div><span class="muted">Ciudad</span><strong>{{ publicProfile().city || '-' }}</strong></div>
                <div><span class="muted">Relacion</span><strong>{{ publicProfile().relationshipStatus || '-' }}</strong></div>
                <div><span class="muted">Body type</span><strong>{{ publicProfile().bodyType || '-' }}</strong></div>
                <div><span class="muted">Idiomas</span><strong>{{ publicProfile().languages.join(' · ') || '-' }}</strong></div>
              </div>
            </div>
          </section>

          <!-- Social links -->
          <section class="panel-card profile-section" *ngIf="hasSocialLinks()">
            <div class="profile-section-header">
              <h3 class="mini-title">Redes y enlaces</h3>
            </div>
            <div class="social-links-grid">
              <a *ngIf="publicProfile().instagramUrl" class="social-link-card" [href]="publicProfile().instagramUrl" target="_blank" rel="noreferrer"><span class="social-icon">IG</span><span>Instagram</span></a>
              <a *ngIf="publicProfile().xUrl" class="social-link-card" [href]="publicProfile().xUrl" target="_blank" rel="noreferrer"><span class="social-icon">X</span><span>X</span></a>
              <a *ngIf="publicProfile().onlyFansUrl" class="social-link-card" [href]="publicProfile().onlyFansUrl" target="_blank" rel="noreferrer"><span class="social-icon">OF</span><span>OnlyFans</span></a>
              <a *ngIf="publicProfile().websiteUrl" class="social-link-card" [href]="publicProfile().websiteUrl" target="_blank" rel="noreferrer"><span class="social-icon">WEB</span><span>Website</span></a>
            </div>
          </section>

          <!-- Store preview -->
          <section class="panel-card profile-section">
            <div class="profile-section-header">
              <h3 class="mini-title">Tienda destacada</h3>
              <a class="text-link" href="#">Ver tienda</a>
            </div>
            <div class="media-strip">
              <article class="media-card" *ngFor="let item of storePreview()">
                <div class="media-card-thumb media-card-store">{{ item.type === 'store' ? 'SHOP' : 'MEDIA' }}</div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.price || 'Disponible' }}</span>
              </article>
            </div>
          </section>

          <!-- Video preview -->
          <section class="panel-card profile-section">
            <div class="profile-section-header">
              <h3 class="mini-title">Videos</h3>
              <a class="text-link" href="#">Ver todo</a>
            </div>
            <div class="media-strip">
              <article class="media-card" *ngFor="let item of videoPreview()">
                <div class="media-card-thumb" [class.media-card-premium]="item.type === 'premium'">
                  {{ item.type === 'premium' ? 'VIP' : 'FREE' }}
                </div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.price || 'Gratis' }}</span>
              </article>
            </div>
          </section>
        </div>

        <aside class="stream-sidebar">
          <!-- Chat -->
          <section class="panel-card chat-panel">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
              <span class="chat-mode-badge">{{ stream()!.viewerAccess?.chatMode || 'registered' }}</span>
            </div>

            <div class="chat-messages">
              <article class="chat-message" *ngFor="let message of messages()">
                <span class="chat-author">{{ message.authorName }}</span>
                <p>{{ message.body }}</p>
              </article>
              <div *ngIf="messages().length === 0" class="chat-empty">
                <p class="muted">Aún no hay mensajes. ¡Sé el primero!</p>
              </div>
            </div>

            <form *ngIf="canChat(); else loginForChat" class="chat-form" (submit)="sendMessage($event)">
              <input type="text" name="message" placeholder="Escribe un mensaje..." autocomplete="off" />
              <button type="submit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M14 8 2 2l3 6-3 6 12-6Z" fill="currentColor"/></svg>
              </button>
            </form>

            <ng-template #loginForChat>
              <div class="chat-locked">
                <p class="muted">{{ chatLockMessage() }}</p>
                <div class="studio-actions">
                  <a *ngIf="!authApi.isAuthenticated()" class="text-link" routerLink="/login">Entrar</a>
                  <button *ngIf="authApi.isAuthenticated()" type="button" class="text-link" (click)="unlockPrivate()">Desbloquear</button>
                  <button *ngIf="authApi.isAuthenticated()" type="button" class="text-link" (click)="subscribe()">Suscribirme</button>
                </div>
              </div>
            </ng-template>
          </section>

          <!-- Wallet -->
          <section class="panel-card" *ngIf="authApi.isAuthenticated()">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Wallet</h2>
              <span class="wallet-balance-badge">{{ wallet()?.balance ?? 0 }} tokens</span>
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

          <!-- Premium access info -->
          <section class="panel-card room-premium-card">
            <p class="eyebrow">Premium</p>
            <h2 class="mini-title" style="margin-bottom: 10px;">Acceso exclusivo</h2>
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
  readonly followersCount = computed(() => 1800 + this.publicProfile().categories.length * 240);
  readonly profileViewsCount = computed(() => 12000 + this.publicProfile().subcategories.length * 750);
  readonly rankingScore = computed(() => 120 + this.publicProfile().languages.length * 12);
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

  coverStyle() {
    return (
      this.publicProfile().coverImageUrl ??
      'linear-gradient(135deg, rgba(21,159,149,0.32), rgba(255,138,61,0.22), rgba(7,18,20,0.94))'
    );
  }

  accessEyebrow() {
    return this.stream()?.viewerAccess?.accessMode === 'private' ? 'Show privado' : 'Contenido premium';
  }

  accessHeadline() {
    return this.stream()?.viewerAccess?.accessMode === 'private' ? 'Acceso exclusivo' : 'Suscripción requerida';
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

  chatLockMessage() {
    const access = this.stream()?.viewerAccess;
    if (!this.authApi.isAuthenticated()) {
      return 'Entra con tu cuenta para acceder al chat y a los desbloqueos premium.';
    }
    if (access?.chatMode === 'members') {
      return 'Este chat es solo para miembros o usuarios con acceso privado activo.';
    }
    if (access?.chatMode === 'tippers') {
      return 'Este chat es solo para tippers, miembros o usuarios con acceso privado.';
    }
    return 'El chat necesita acceso registrado y permisos activos en la sala.';
  }

  storePreview(): MediaPreview[] {
    return [
      { title: 'Wishlist premium', type: 'store', price: '12 tokens' },
      { title: 'Private pack', type: 'store', price: '45 tokens' },
      { title: 'Gift request', type: 'store', price: '25 tokens' },
    ];
  }

  videoPreview(): MediaPreview[] {
    return [
      { title: 'Teaser diario', type: 'free' },
      { title: 'Afterhours cut', type: 'premium', price: '18 tokens' },
      { title: 'VIP backstage', type: 'premium', price: '32 tokens' },
      { title: 'Free intro clip', type: 'free' },
    ];
  }

  hasSocialLinks() {
    return Boolean(
      this.publicProfile().instagramUrl ||
      this.publicProfile().xUrl ||
      this.publicProfile().onlyFansUrl ||
      this.publicProfile().websiteUrl,
    );
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;

    if (!input || !input.value.trim() || !this.stream() || !this.canChat()) {
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
