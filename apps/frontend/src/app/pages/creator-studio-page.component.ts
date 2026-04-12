import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingConfig, CreatorDashboard, UpsertCreatorProfileRequest, UpsertCreatorRoomRequest, WalletSummary } from '@naughtybox/shared-types';
import { AuthApiService } from '../services/auth-api.service';
import { CreatorApiService } from '../services/creator-api.service';
import { WalletApiService } from '../services/wallet-api.service';
import { StudioProfileFormComponent } from './studio/studio-profile-form.component';
import { StudioRoomFormComponent } from './studio/studio-room-form.component';
import { StudioSidebarComponent } from './studio/studio-sidebar.component';

@Component({
  selector: 'app-creator-studio-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StudioProfileFormComponent, StudioRoomFormComponent, StudioSidebarComponent],
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

          <app-studio-profile-form
            [profile]="dashboard()?.profile"
            [fallbackName]="dashboard()?.user?.username"
            (save)="onSaveProfile($event)"
          />

          <app-studio-room-form
            [room]="dashboard()?.room"
            (save)="onSaveRoom($event)"
          />
        </div>

        <app-studio-sidebar
          [dashboard]="dashboard()"
          [billing]="billing()"
          [wallet]="wallet()"
          [notice]="notice()"
          [error]="error()"
          (addDevCredit)="onAddDevCredit()"
        />
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

  async onSaveProfile(payload: UpsertCreatorProfileRequest) {
    try {
      await this.creatorApi.saveProfile(payload);
      await this.loadDashboard();
      this.notice.set('Perfil guardado.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    }
  }

  async onSaveRoom(payload: UpsertCreatorRoomRequest) {
    try {
      await this.creatorApi.saveRoom(payload);
      await this.loadDashboard();
      this.notice.set('Sala guardada.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar la sala.');
    }
  }

  async onAddDevCredit() {
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
