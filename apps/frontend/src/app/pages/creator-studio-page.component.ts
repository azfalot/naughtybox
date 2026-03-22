import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingConfig, CreatorDashboard, WalletSummary } from '@naughtybox/shared-types';
import { AuthApiService } from '../services/auth-api.service';
import { CreatorApiService } from '../services/creator-api.service';
import { WalletApiService } from '../services/wallet-api.service';

@Component({
  selector: 'app-creator-studio-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page page-wide">
      <section *ngIf="!authApi.isAuthenticated()" class="panel-card studio-empty">
        <p class="eyebrow">Creator Studio</p>
        <h1 class="lobby-title">Necesitas iniciar sesion</h1>
        <p class="muted">El estudio protege perfil, stream key, chat privado y futuras capas de pagos y tokens.</p>
        <div class="studio-actions">
          <a class="text-link" routerLink="/login">Entrar</a>
          <a class="text-link" routerLink="/register">Crear cuenta</a>
        </div>
      </section>

      <section *ngIf="authApi.isAuthenticated()" class="studio-layout">
        <div class="studio-main">
          <section class="panel-card">
            <p class="eyebrow">Creator Studio</p>
            <h1 class="lobby-title">Tu sala y tu identidad</h1>
            <p class="muted">Configura perfil, categorias, redes, biografia y sala publica. Esto alimentara filtros, rankings, follows y el perfil comercial.</p>
          </section>

          <section class="panel-card">
            <h2 class="mini-title">Perfil de creadora</h2>
            <form class="studio-form" (submit)="saveProfile($event)">
              <label>
                <span>Display name</span>
                <input name="displayName" [value]="dashboard()?.profile?.displayName ?? dashboard()?.user?.username ?? ''" />
              </label>
              <label>
                <span>Slug</span>
                <input name="slug" [value]="dashboard()?.profile?.slug ?? dashboard()?.user?.username ?? ''" />
              </label>
              <label>
                <span>Edad</span>
                <input name="age" type="number" min="18" [value]="dashboard()?.profile?.age ?? ''" />
              </label>
              <label>
                <span>Genero</span>
                <input name="gender" [value]="dashboard()?.profile?.gender ?? ''" />
              </label>
              <label>
                <span>Pais</span>
                <input name="country" [value]="dashboard()?.profile?.country ?? ''" />
              </label>
              <label>
                <span>Ciudad</span>
                <input name="city" [value]="dashboard()?.profile?.city ?? ''" />
              </label>
              <label>
                <span>Interesada en</span>
                <input name="interestedIn" [value]="dashboard()?.profile?.interestedIn ?? ''" />
              </label>
              <label>
                <span>Relacion</span>
                <input name="relationshipStatus" [value]="dashboard()?.profile?.relationshipStatus ?? ''" />
              </label>
              <label>
                <span>Body type</span>
                <input name="bodyType" [value]="dashboard()?.profile?.bodyType ?? ''" />
              </label>
              <label>
                <span>Accent color</span>
                <input name="accentColor" [value]="dashboard()?.profile?.accentColor ?? '#ff5b73'" />
              </label>
              <label>
                <span>Avatar URL</span>
                <input name="avatarUrl" [value]="dashboard()?.profile?.avatarUrl ?? ''" />
              </label>
              <label>
                <span>Cover URL</span>
                <input name="coverImageUrl" [value]="dashboard()?.profile?.coverImageUrl ?? ''" />
              </label>
              <label class="studio-span">
                <span>Bio</span>
                <textarea name="bio">{{ dashboard()?.profile?.bio ?? '' }}</textarea>
              </label>
              <label class="studio-span">
                <span>Idiomas</span>
                <input name="languages" [value]="(dashboard()?.profile?.languages ?? []).join(', ')" />
              </label>
              <label class="studio-span">
                <span>Categorias</span>
                <input name="categories" [value]="(dashboard()?.profile?.categories ?? []).join(', ')" />
              </label>
              <label class="studio-span">
                <span>Subcategorias</span>
                <input name="subcategories" [value]="(dashboard()?.profile?.subcategories ?? []).join(', ')" />
              </label>
              <label class="studio-span">
                <span>Tags</span>
                <input name="tags" [value]="(dashboard()?.profile?.tags ?? []).join(', ')" />
              </label>
              <label>
                <span>Instagram</span>
                <input name="instagramUrl" [value]="dashboard()?.profile?.instagramUrl ?? ''" />
              </label>
              <label>
                <span>X / Twitter</span>
                <input name="xUrl" [value]="dashboard()?.profile?.xUrl ?? ''" />
              </label>
              <label>
                <span>Website</span>
                <input name="websiteUrl" [value]="dashboard()?.profile?.websiteUrl ?? ''" />
              </label>
              <button type="submit">Guardar perfil</button>
            </form>
          </section>

          <section class="panel-card">
            <h2 class="mini-title">Sala publica</h2>
            <form class="studio-form" (submit)="saveRoom($event)">
              <label>
                <span>Titulo</span>
                <input name="title" [value]="dashboard()?.room?.title ?? ''" />
              </label>
              <label>
                <span>Acceso</span>
                <input name="accessMode" [value]="dashboard()?.room?.accessMode ?? 'public'" />
              </label>
              <label>
                <span>Chat</span>
                <input name="chatMode" [value]="dashboard()?.room?.chatMode ?? 'registered'" />
              </label>
              <label>
                <span>Tags</span>
                <input name="tags" [value]="(dashboard()?.room?.tags ?? []).join(', ')" />
              </label>
              <label>
                <span>Precio privado</span>
                <input name="privateEntryTokens" type="number" min="1" [value]="dashboard()?.room?.privateEntryTokens ?? 120" />
              </label>
              <label>
                <span>Precio mensual</span>
                <input name="memberMonthlyTokens" type="number" min="1" [value]="dashboard()?.room?.memberMonthlyTokens ?? 450" />
              </label>
              <label class="studio-span">
                <span>Descripcion</span>
                <textarea name="description">{{ dashboard()?.room?.description ?? '' }}</textarea>
              </label>
              <button type="submit">Guardar sala</button>
            </form>
          </section>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card">
            <h2 class="mini-title">Estado</h2>
            <div class="creator-grid">
              <div>
                <p class="muted stat-label">Rol</p>
                <strong>{{ dashboard()?.user?.role ?? 'viewer' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Sala</p>
                <strong>{{ dashboard()?.room?.slug ?? 'sin crear' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Live</p>
                <strong>{{ dashboard()?.stream?.isLive ? 'online' : 'offline' }}</strong>
              </div>
            </div>
          </section>

          <section class="panel-card" *ngIf="dashboard()?.room as room">
            <h2 class="mini-title">Configurar OBS</h2>
            <span class="inline-code">rtmp://localhost:1935/live</span>
            <p class="muted" style="margin-top: 14px;">Stream key</p>
            <span class="inline-code">{{ room.streamKey }}</span>
            <p class="muted" style="margin-top: 14px;">Acceso / chat</p>
            <span class="inline-code">{{ room.accessMode }} / {{ room.chatMode }}</span>
            <p class="muted" style="margin-top: 14px;">Siguiente fase</p>
            <span class="inline-code">Broadcast web desde navegador</span>
          </section>

          <section class="panel-card" *ngIf="dashboard()?.profile as profile">
            <h2 class="mini-title">Descubrimiento</h2>
            <ul class="helper-list">
              <li>{{ profile.categories.join(' · ') || 'Sin categorias' }}</li>
              <li>{{ profile.subcategories.join(' · ') || 'Sin subcategorias' }}</li>
              <li>{{ profile.languages.join(' · ') || 'Sin idiomas' }}</li>
            </ul>
          </section>

          <section class="panel-card" *ngIf="billing() as billing">
            <h2 class="mini-title">Tokens y pagos</h2>
            <p class="muted">
              La base ya soporta wallet, ledger y propinas. Ahora mismo todo corre en modo {{ billing.mode }} para validar la plataforma sin pagos reales.
            </p>
            <div class="creator-grid">
              <div>
                <p class="muted stat-label">Packs</p>
                <strong>{{ billing.tokenPackageSizes.join(' / ') }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Fee</p>
                <strong>{{ billing.platformFeePercent }}%</strong>
              </div>
              <div>
                <p class="muted stat-label">Hold</p>
                <strong>{{ billing.payoutHoldDays }} dias</strong>
              </div>
            </div>
          </section>

          <section class="panel-card">
            <h2 class="mini-title">Centro para creadoras</h2>
            <div class="resource-stack">
              <a class="resource-card" routerLink="/legal/creators">
                <strong>Guia operativa</strong>
                <span>Onboarding, payouts, ranking, perfil y buenas practicas.</span>
              </a>
              <a class="resource-card" routerLink="/legal/18plus">
                <strong>Mayoría de edad y compliance</strong>
                <span>Verificacion, consentimiento, reportes y moderacion.</span>
              </a>
              <a class="resource-card" routerLink="/legal/privacy">
                <strong>Privacidad y datos</strong>
                <span>Que datos tratamos y por que necesitamos procesos reforzados.</span>
              </a>
            </div>

            <ul class="helper-list" style="margin-top: 14px;">
              <li>Contenido orientativo sobre alta, facturacion y declaracion de ingresos en Espana.</li>
              <li>Metricas utiles para conversion: viewers, follows, tips y rendimiento por franja.</li>
              <li>Configuracion futura de payouts, suscripciones, privados y juguetes conectados.</li>
            </ul>
          </section>

          <section class="panel-card" *ngIf="wallet() as wallet">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Wallet</h2>
              <span class="viewer-pill">{{ wallet.balance }} tokens</span>
            </div>
            <div class="studio-actions" style="margin-top: 12px;">
              <button type="button" class="text-link" (click)="addDevCredit()">Recarga dev +250</button>
            </div>
            <ul class="helper-list" style="margin-top: 14px;">
              <li *ngFor="let transaction of wallet.recentTransactions.slice(0, 6)">
                {{ transaction.type }} · {{ transaction.amount }} · {{ transaction.balanceAfter }}
              </li>
            </ul>
          </section>

          <p *ngIf="notice()" class="studio-notice">{{ notice() }}</p>
          <p *ngIf="error()" class="form-error">{{ error() }}</p>
        </aside>
      </section>
    </main>
  `,
})
export class CreatorStudioPageComponent implements OnInit {
  readonly authApi = inject(AuthApiService);
  private readonly creatorApi = inject(CreatorApiService);
  private readonly walletApi = inject(WalletApiService);

  readonly dashboard = signal<CreatorDashboard | null>(null);
  readonly billing = signal<BillingConfig | null>(null);
  readonly wallet = signal<WalletSummary | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly isCreator = computed(() => this.dashboard()?.user.role === 'creator');

  async ngOnInit() {
    if (!this.authApi.isAuthenticated()) {
      return;
    }

    try {
      await this.authApi.me();
      await Promise.all([this.loadDashboard(), this.loadBilling(), this.loadWallet()]);
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el studio.');
    }
  }

  async saveProfile(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    try {
      await this.creatorApi.saveProfile({
        displayName: (form.elements.namedItem('displayName') as HTMLInputElement)?.value ?? '',
        slug: (form.elements.namedItem('slug') as HTMLInputElement)?.value ?? '',
        bio: (form.elements.namedItem('bio') as HTMLTextAreaElement)?.value ?? '',
        avatarUrl: (form.elements.namedItem('avatarUrl') as HTMLInputElement)?.value ?? '',
        coverImageUrl: (form.elements.namedItem('coverImageUrl') as HTMLInputElement)?.value ?? '',
        accentColor: (form.elements.namedItem('accentColor') as HTMLInputElement)?.value ?? '',
        tags: this.splitTags((form.elements.namedItem('tags') as HTMLInputElement)?.value ?? ''),
        age: Number((form.elements.namedItem('age') as HTMLInputElement)?.value || 0) || undefined,
        gender: (form.elements.namedItem('gender') as HTMLInputElement)?.value ?? '',
        country: (form.elements.namedItem('country') as HTMLInputElement)?.value ?? '',
        city: (form.elements.namedItem('city') as HTMLInputElement)?.value ?? '',
        interestedIn: (form.elements.namedItem('interestedIn') as HTMLInputElement)?.value ?? '',
        relationshipStatus: (form.elements.namedItem('relationshipStatus') as HTMLInputElement)?.value ?? '',
        bodyType: (form.elements.namedItem('bodyType') as HTMLInputElement)?.value ?? '',
        languages: this.splitTags((form.elements.namedItem('languages') as HTMLInputElement)?.value ?? ''),
        categories: this.splitTags((form.elements.namedItem('categories') as HTMLInputElement)?.value ?? ''),
        subcategories: this.splitTags((form.elements.namedItem('subcategories') as HTMLInputElement)?.value ?? ''),
        instagramUrl: (form.elements.namedItem('instagramUrl') as HTMLInputElement)?.value ?? '',
        xUrl: (form.elements.namedItem('xUrl') as HTMLInputElement)?.value ?? '',
        websiteUrl: (form.elements.namedItem('websiteUrl') as HTMLInputElement)?.value ?? '',
      });
      await this.loadDashboard();
      this.notice.set('Perfil guardado.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    }
  }

  async saveRoom(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    try {
      await this.creatorApi.saveRoom({
        title: (form.elements.namedItem('title') as HTMLInputElement)?.value ?? '',
        description: (form.elements.namedItem('description') as HTMLTextAreaElement)?.value ?? '',
        tags: this.splitTags((form.elements.namedItem('tags') as HTMLInputElement)?.value ?? ''),
        accessMode: ((form.elements.namedItem('accessMode') as HTMLInputElement)?.value ?? 'public') as 'public' | 'premium' | 'private',
        chatMode: ((form.elements.namedItem('chatMode') as HTMLInputElement)?.value ?? 'registered') as 'registered' | 'members' | 'tippers',
        privateEntryTokens: Number((form.elements.namedItem('privateEntryTokens') as HTMLInputElement)?.value || 120),
        memberMonthlyTokens: Number((form.elements.namedItem('memberMonthlyTokens') as HTMLInputElement)?.value || 450),
      });
      await this.loadDashboard();
      this.notice.set('Sala guardada.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar la sala.');
    }
  }

  async addDevCredit() {
    try {
      this.wallet.set(await this.walletApi.addDevCredit());
      this.notice.set('Wallet recargada con saldo de desarrollo.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo recargar la wallet.');
    }
  }

  private async loadDashboard() {
    this.dashboard.set(await this.creatorApi.getDashboard());
  }

  private async loadBilling() {
    this.billing.set(await this.creatorApi.getBillingConfig());
  }

  private async loadWallet() {
    this.wallet.set(await this.walletApi.getWallet());
  }

  private splitTags(value: string) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
