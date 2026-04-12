import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingConfig, CreatorDashboard, UpsertCreatorProfileRequest, UpsertCreatorRoomRequest, WalletSummary } from '@naughtybox/shared-types';
import { AuthApiService } from '../services/auth-api.service';
import { CreatorApiService } from '../services/creator-api.service';
import { WalletApiService } from '../services/wallet-api.service';
import { StudioProfileFormComponent } from '../components/studio-profile-form.component';
import { StudioRoomFormComponent } from '../components/studio-room-form.component';

@Component({
  selector: 'app-creator-studio-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StudioProfileFormComponent, StudioRoomFormComponent],
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

          <app-studio-profile-form [dashboard]="dashboard()" (save)="saveProfile($event)" />

          <app-studio-room-form [dashboard]="dashboard()" (save)="saveRoom($event)" />
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

  async saveProfile(request: UpsertCreatorProfileRequest) {
    try {
      await this.creatorApi.saveProfile(request);
      await this.loadDashboard();
      this.notice.set('Perfil guardado.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    }
  }

  async saveRoom(request: UpsertCreatorRoomRequest) {
    try {
      await this.creatorApi.saveRoom(request);
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
}
