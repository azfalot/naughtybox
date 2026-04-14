import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CreatorDashboard, resolveStreamRoomPresence } from '@naughtybox/shared-types';
import { ToastService } from '../../../services/toast.service';
import { AuthApiService } from '../../../shared/services/auth-api.service';
import { CreatorApiService } from '../../../shared/services/creator-api.service';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-broadcast-booth-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <main class="page page-wide" data-testid="broadcast-booth-page">
      <a class="muted back-link" routerLink="/studio">Volver al Studio</a>

      <section *ngIf="!authApi.isAuthenticated()" class="panel-card studio-empty">
        <p class="eyebrow">Cabina</p>
        <h1 class="lobby-title">Necesitas iniciar sesion</h1>
        <p class="muted">La cabina de emision requiere una cuenta de creador activa.</p>
        <div class="studio-actions">
          <a class="text-link" routerLink="/login">Entrar</a>
        </div>
      </section>

      <section *ngIf="authApi.isAuthenticated() && dashboard() as dashboard" class="panel-card">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">Cabina web</p>
            <h1 class="lobby-title">Emite desde navegador</h1>
            <p class="muted">
              Pulsa iniciar para abrir la cabina WebRTC local. La sala publica pasara de preparing a live cuando haya
              señal real de ingest.
            </p>
          </div>
          <div class="studio-actions">
            <a
              class="action-button action-button-ghost"
              *ngIf="dashboard.room?.slug as roomSlug"
              [routerLink]="['/streams', roomSlug]"
              target="_blank"
            >
              <app-icon name="camera" [size]="14"></app-icon>
              Abrir sala
            </a>
            <button type="button" class="action-button action-button-warn" *ngIf="!isPublishing()" (click)="startBroadcast()">
              <app-icon name="camera" [size]="14"></app-icon>
              Iniciar emision
            </button>
            <button type="button" class="action-button action-button-ghost" *ngIf="isPublishing()" (click)="stopBroadcast()">
              <app-icon name="close" [size]="14"></app-icon>
              Detener emision
            </button>
          </div>
        </div>

        <div class="creator-grid">
          <div>
            <p class="muted stat-label">Sala</p>
            <strong>{{ dashboard.room?.slug || 'sin sala' }}</strong>
          </div>
          <div>
            <p class="muted stat-label">Sesion</p>
            <strong>{{ dashboard.stream?.activeSession?.status || 'idle' }}</strong>
          </div>
          <div>
            <p class="muted stat-label">Estado publico</p>
            <strong>{{ roomPresence() }}</strong>
          </div>
        </div>

        <section class="panel-card" *ngIf="publishUrl() as publishUrl">
          <h2 class="mini-title">Cabina activa</h2>
          <iframe
            class="publish-frame"
            [src]="publishUrl"
            title="Cabina de emision"
            allow="camera; microphone; autoplay; fullscreen; display-capture"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </section>
      </section>
    </main>
  `,
})
export class BroadcastBoothPageComponent implements OnInit, OnDestroy {
  readonly authApi = inject(AuthApiService);
  private readonly creatorApi = inject(CreatorApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);

  readonly dashboard = signal<CreatorDashboard | null>(null);
  readonly publishUrl = signal<SafeResourceUrl | null>(null);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly isPublishing = computed(() => Boolean(this.publishUrl()));
  readonly roomPresence = computed(() => {
    const stream = this.dashboard()?.stream;
    const presence = resolveStreamRoomPresence({
      isLive: stream?.isLive,
      activeSessionStatus: stream?.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'live';
    if (presence === 'preparing') return 'preparing';
    if (presence === 'ended') return 'ended';
    return 'offline';
  });

  async ngOnInit() {
    if (!this.authApi.isAuthenticated()) {
      return;
    }

    await this.refreshState();
    this.refreshTimer = setInterval(() => {
      void this.refreshState();
    }, 6000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  async startBroadcast() {
    const streamKey = this.dashboard()?.room?.streamKey;
    if (!streamKey || typeof window === 'undefined') {
      return;
    }

    await this.creatorApi.startBroadcast();
    this.publishUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(
        `${window.location.protocol}//${window.location.hostname}:8889/live/${streamKey}/publish`,
      ),
    );
    await this.refreshState();
    this.toast.success('Sesion de broadcast iniciada. Esperando ingest real.');
  }

  async stopBroadcast() {
    await this.creatorApi.stopBroadcast();
    this.publishUrl.set(null);
    await this.refreshState();
    this.toast.success('Sesion de broadcast detenida.');
  }

  private async refreshState() {
    const dashboard = await this.creatorApi.getDashboard();
    this.dashboard.set(dashboard);

    if (!dashboard.stream?.activeSession) {
      this.publishUrl.set(null);
    }
  }
}
