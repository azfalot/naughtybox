import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingConfig, CreatorDashboard, WalletSummary } from '@naughtybox/shared-types';

@Component({
  selector: 'app-studio-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="stream-sidebar">
      <section class="panel-card">
        <h2 class="mini-title">Estado</h2>
        <div class="creator-grid">
          <div>
            <p class="muted stat-label">Rol</p>
            <strong>{{ dashboard?.user?.role ?? 'viewer' }}</strong>
          </div>
          <div>
            <p class="muted stat-label">Sala</p>
            <strong>{{ dashboard?.room?.slug ?? 'sin crear' }}</strong>
          </div>
          <div>
            <p class="muted stat-label">Live</p>
            <strong>{{ dashboard?.stream?.isLive ? 'online' : 'offline' }}</strong>
          </div>
        </div>
      </section>

      <section class="panel-card" *ngIf="dashboard?.room as room">
        <h2 class="mini-title">Configurar OBS</h2>
        <span class="inline-code">rtmp://localhost:1935/live</span>
        <p class="muted" style="margin-top: 14px;">Stream key</p>
        <span class="inline-code">{{ room.streamKey }}</span>
        <p class="muted" style="margin-top: 14px;">Acceso / chat</p>
        <span class="inline-code">{{ room.accessMode }} / {{ room.chatMode }}</span>
        <p class="muted" style="margin-top: 14px;">Siguiente fase</p>
        <span class="inline-code">Broadcast web desde navegador</span>
      </section>

      <section class="panel-card" *ngIf="dashboard?.profile as profile">
        <h2 class="mini-title">Descubrimiento</h2>
        <ul class="helper-list">
          <li>{{ profile.categories.join(' · ') || 'Sin categorias' }}</li>
          <li>{{ profile.subcategories.join(' · ') || 'Sin subcategorias' }}</li>
          <li>{{ profile.languages.join(' · ') || 'Sin idiomas' }}</li>
        </ul>
      </section>

      <section class="panel-card" *ngIf="billing as b">
        <h2 class="mini-title">Tokens y pagos</h2>
        <p class="muted">
          La base ya soporta wallet, ledger y propinas. Ahora mismo todo corre en modo {{ b.mode }} para validar la plataforma sin pagos reales.
        </p>
        <div class="creator-grid">
          <div>
            <p class="muted stat-label">Packs</p>
            <strong>{{ b.tokenPackageSizes.join(' / ') }}</strong>
          </div>
          <div>
            <p class="muted stat-label">Fee</p>
            <strong>{{ b.platformFeePercent }}%</strong>
          </div>
          <div>
            <p class="muted stat-label">Hold</p>
            <strong>{{ b.payoutHoldDays }} dias</strong>
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

      <section class="panel-card" *ngIf="wallet as w">
        <div class="chat-header">
          <h2 class="mini-title" style="margin: 0;">Wallet</h2>
          <span class="viewer-pill">{{ w.balance }} tokens</span>
        </div>
        <div class="studio-actions" style="margin-top: 12px;">
          <button type="button" class="text-link" (click)="addDevCredit.emit()">Recarga dev +250</button>
        </div>
        <ul class="helper-list" style="margin-top: 14px;">
          <li *ngFor="let transaction of w.recentTransactions.slice(0, 6)">
            {{ transaction.type }} · {{ transaction.amount }} · {{ transaction.balanceAfter }}
          </li>
        </ul>
      </section>

      <p *ngIf="notice" class="studio-notice">{{ notice }}</p>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </aside>
  `,
})
export class StudioSidebarComponent {
  @Input() dashboard: CreatorDashboard | null = null;
  @Input() billing: BillingConfig | null = null;
  @Input() wallet: WalletSummary | null = null;
  @Input() notice = '';
  @Input() error = '';
  @Output() addDevCredit = new EventEmitter<void>();
}
