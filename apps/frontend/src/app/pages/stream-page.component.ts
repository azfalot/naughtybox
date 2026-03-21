import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatMessage, CreatorPublicProfile, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
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
                <strong>{{ publicProfile().categories.join(' · ') || 'General' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Pais</p>
                <strong>{{ publicProfile().country || 'Sin definir' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Interesada en</p>
                <strong>{{ publicProfile().interestedIn || 'Sin definir' }}</strong>
              </div>
            </div>
          </section>

          <section class="panel-card profile-hero" [style.background]="coverStyle()">
            <div class="profile-hero-copy">
              <p class="eyebrow">Perfil</p>
              <h2>{{ publicProfile().displayName }}</h2>
              <p class="muted">{{ publicProfile().bio }}</p>
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

          <section class="panel-card profile-section">
            <div class="profile-section-grid">
              <div>
                <h3 class="mini-title">Acerca de {{ publicProfile().displayName }}</h3>
                <p class="muted room-bio">{{ publicProfile().bio }}</p>
              </div>
              <div class="profile-facts">
                <div><span class="muted">Edad</span><strong>{{ publicProfile().age || '—' }}</strong></div>
                <div><span class="muted">Genero</span><strong>{{ publicProfile().gender || '—' }}</strong></div>
                <div><span class="muted">Ciudad</span><strong>{{ publicProfile().city || '—' }}</strong></div>
                <div><span class="muted">Relacion</span><strong>{{ publicProfile().relationshipStatus || '—' }}</strong></div>
                <div><span class="muted">Body type</span><strong>{{ publicProfile().bodyType || '—' }}</strong></div>
                <div><span class="muted">Idiomas</span><strong>{{ publicProfile().languages.join(' · ') || '—' }}</strong></div>
              </div>
            </div>
          </section>

          <section class="panel-card profile-section">
            <div class="profile-section-header">
              <h3 class="mini-title">Redes y enlaces</h3>
            </div>
            <div class="social-links-grid">
              <a *ngIf="publicProfile().instagramUrl" class="social-link-card" [href]="publicProfile().instagramUrl" target="_blank" rel="noreferrer">Instagram</a>
              <a *ngIf="publicProfile().xUrl" class="social-link-card" [href]="publicProfile().xUrl" target="_blank" rel="noreferrer">X</a>
              <a *ngIf="publicProfile().websiteUrl" class="social-link-card" [href]="publicProfile().websiteUrl" target="_blank" rel="noreferrer">Website</a>
            </div>
          </section>

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
                <p class="muted">El chat queda reservado a usuarios registrados para moderacion, seguridad y futuras reglas para tippers o miembros VIP.</p>
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
            <h2 class="mini-title">Acceso premium</h2>
            <ul class="helper-list">
              <li>Private shows por tokens</li>
              <li>Chat solo para tippers o miembros</li>
              <li>Integracion futura de toys conectados</li>
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
      'linear-gradient(135deg, rgba(255,89,116,0.32), rgba(27,183,167,0.22), rgba(16,11,24,0.92))'
    );
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
