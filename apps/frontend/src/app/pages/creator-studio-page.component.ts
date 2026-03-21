import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingConfig, CreatorDashboard } from '@naughtybox/shared-types';
import { AuthApiService } from '../services/auth-api.service';
import { CreatorApiService } from '../services/creator-api.service';

@Component({
  selector: 'app-creator-studio-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page page-wide">
      <section *ngIf="!authApi.isAuthenticated()" class="panel-card studio-empty">
        <p class="eyebrow">Creator Studio</p>
        <h1 class="lobby-title">Necesitas iniciar sesion</h1>
        <p class="muted">El estudio protege perfil, stream key, chat privado y futuras capas de pagos/tokens.</p>
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
            <p class="muted">Configura perfil, slug y sala publica. La stream key sigue tu slug por ahora.</p>
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
              <label class="studio-span">
                <span>Bio</span>
                <textarea name="bio">{{ dashboard()?.profile?.bio ?? '' }}</textarea>
              </label>
              <label>
                <span>Avatar URL</span>
                <input name="avatarUrl" [value]="dashboard()?.profile?.avatarUrl ?? ''" />
              </label>
              <label>
                <span>Accent color</span>
                <input name="accentColor" [value]="dashboard()?.profile?.accentColor ?? '#ff5b73'" />
              </label>
              <label class="studio-span">
                <span>Tags</span>
                <input name="tags" [value]="(dashboard()?.profile?.tags ?? []).join(', ')" />
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
                <span>Tags</span>
                <input name="tags" [value]="(dashboard()?.room?.tags ?? []).join(', ')" />
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
          </section>

          <section class="panel-card" *ngIf="billing() as billing">
            <h2 class="mini-title">Tokens y pagos</h2>
            <p class="muted">
              Dejamos la base lista para tokens y billing, pero la integracion con proveedor adulto-friendly se decide en la siguiente fase.
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
            <ul class="helper-list" style="margin-top: 14px;">
              <li *ngFor="let provider of billing.providers">
                {{ provider.name }} · {{ provider.status }} · {{ provider.notes }}
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

  readonly dashboard = signal<CreatorDashboard | null>(null);
  readonly billing = signal<BillingConfig | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly isCreator = computed(() => this.dashboard()?.user.role === 'creator');

  async ngOnInit() {
    if (!this.authApi.isAuthenticated()) {
      return;
    }

    try {
      await this.authApi.me();
      await Promise.all([this.loadDashboard(), this.loadBilling()]);
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
        accentColor: (form.elements.namedItem('accentColor') as HTMLInputElement)?.value ?? '',
        tags: this.splitTags((form.elements.namedItem('tags') as HTMLInputElement)?.value ?? ''),
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
      });
      await this.loadDashboard();
      this.notice.set('Sala guardada.');
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar la sala.');
    }
  }

  private async loadDashboard() {
    this.dashboard.set(await this.creatorApi.getDashboard());
  }

  private async loadBilling() {
    this.billing.set(await this.creatorApi.getBillingConfig());
  }

  private splitTags(value: string) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
