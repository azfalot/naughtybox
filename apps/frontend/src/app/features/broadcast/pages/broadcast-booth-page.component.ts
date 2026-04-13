import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  ChatMessage,
  CreatorDashboard,
  resolveStreamRoomPresence,
  TokenTransaction,
  WalletSummary,
} from '@naughtybox/shared-types';
import { AuthApiService } from '../../../services/auth-api.service';
import { ChatApiService } from '../../../services/chat-api.service';
import { CreatorApiService } from '../../../services/creator-api.service';
import { ToastService } from '../../../services/toast.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-broadcast-booth-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <main class="page page-wide">
      <a class="muted back-link" routerLink="/studio">Volver al Studio</a>

      <section *ngIf="!authApi.isAuthenticated()" class="panel-card studio-empty">
        <p class="eyebrow">Cabina</p>
        <h1 class="lobby-title">Necesitas iniciar sesion</h1>
        <p class="muted">La cabina de emision requiere una cuenta de creador activa.</p>
        <div class="studio-actions">
          <a class="text-link" routerLink="/login">Entrar</a>
        </div>
      </section>

      <section *ngIf="authApi.isAuthenticated() && dashboard() as dashboard" class="stream-layout">
        <div class="studio-main">
          <section class="panel-card">
            <div class="profile-section-header">
              <div>
                <p class="eyebrow">Cabina de emision</p>
                <h1 class="lobby-title">Emite desde navegador</h1>
                <p class="muted">
                  Esta vista sirve para arrancar y parar la emision, leer el chat y abrir tu sala publica sin perder el
                  control.
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
                <button
                  type="button"
                  class="action-button action-button-warn"
                  *ngIf="!isPublishing()"
                  (click)="startBroadcast()"
                >
                  <app-icon name="camera" [size]="14"></app-icon>
                  Iniciar emision
                </button>
                <button
                  type="button"
                  class="action-button action-button-ghost"
                  *ngIf="isPublishing()"
                  (click)="stopBroadcast()"
                >
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
                <p class="muted stat-label">Acceso</p>
                <strong>{{ dashboard.room?.accessMode || 'public' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Chat</p>
                <strong>{{ dashboard.room?.chatMode || 'registered' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Directo</p>
                <strong>{{ streamPresenceLabel(dashboard) }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Sesion</p>
                <strong>{{ dashboard.stream?.activeSession?.status || 'idle' }}</strong>
              </div>
              <div>
                <p class="muted stat-label">Salida publica</p>
                <strong>{{ dashboard.stream?.playback?.preferredMode === 'webrtc' ? 'WebRTC' : 'HLS' }}</strong>
              </div>
            </div>

            <p class="studio-notice" *ngIf="dashboard.room?.accessMode !== 'public'">
              Tu sala no es publica ahora mismo. Si emites en modo {{ dashboard.room?.accessMode }}, otros usuarios no
              la veran libremente hasta tener acceso.
            </p>
          </section>

          <section class="panel-card" *ngIf="isPublishing() && publishUrl() as publishUrl; else boothIdle">
            <div class="profile-section-header">
              <div>
                <h2 class="mini-title">Preview de emision</h2>
                <p class="muted">
                  La cabina muestra la captura local. La sala publica usa
                  {{ dashboard.stream?.playback?.preferredMode === 'webrtc' ? 'WebRTC' : 'HLS' }} segun el origen real
                  del directo.
                </p>
              </div>
              <span class="viewer-pill">{{ dashboard.stream?.activeSession?.status || 'esperando señal' }}</span>
            </div>
            <iframe
              class="publish-frame"
              [src]="publishUrl"
              title="Cabina de emision"
              allow="camera; microphone; autoplay; fullscreen; display-capture"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </section>

          <ng-template #boothIdle>
            <section class="panel-card">
              <h2 class="mini-title">Cabina lista</h2>
              <ul class="helper-list">
                <li>Pulsa <strong>Iniciar emision</strong> para abrir la cabina web con camara y micro.</li>
                <li>Usa <strong>Abrir sala</strong> para ver lo que recibe el publico en otra pestana.</li>
                <li>Si quieres mas estabilidad o escenas complejas, usa OBS desde el Studio.</li>
              </ul>
            </section>
          </ng-template>
        </div>

        <aside class="stream-sidebar">
          <section class="panel-card chat-panel">
            <div class="chat-header">
              <h2 class="mini-title" style="margin: 0;">Chat de la sala</h2>
              <span class="muted">{{ dashboard.room?.chatMode || 'registered' }}</span>
            </div>

            <div class="chat-messages">
              <article class="chat-message" *ngFor="let message of messages()">
                <div class="chat-line">
                  <strong>{{ message.authorName }}</strong>
                  <span *ngIf="message.badge" class="chat-badge">{{ message.badge }}</span>
                </div>
                <p>{{ message.body }}</p>
              </article>
            </div>

            <form class="chat-form" *ngIf="dashboard.room?.slug" (submit)="sendMessage($event)">
              <input type="text" name="message" placeholder="Escribe al chat mientras emites..." />
              <button type="submit">Enviar</button>
            </form>
          </section>

          <section class="panel-card">
            <div class="profile-section-header">
              <h2 class="mini-title">Alertas en vivo</h2>
              <span class="viewer-pill">{{ alerts().length }}</span>
            </div>
            <div class="stack-list">
              <article class="stack-item" *ngFor="let alert of alerts()">
                <strong>{{ alert.label }}</strong>
              </article>
              <p class="muted" *ngIf="!alerts().length">
                Las alertas mostraran tips, cambios de estado y avances de goals.
              </p>
            </div>
          </section>

          <section class="panel-card" *ngIf="dashboard.room">
            <h2 class="mini-title">OBS de escritorio</h2>
            <ul class="helper-list">
              <li>Servidor: <span class="inline-code">rtmp://localhost:1935/live</span></li>
              <li>
                Stream key: <span class="inline-code">{{ dashboard.room.streamKey }}</span>
              </li>
              <li>Si necesitas escenas, overlays o varias fuentes, OBS sigue siendo la mejor opcion.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  `,
})
export class BroadcastBoothPageComponent implements OnInit, OnDestroy {
  readonly authApi = inject(AuthApiService);
  private readonly creatorApi = inject(CreatorApiService);
  private readonly chatApi = inject(ChatApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);
  private readonly walletApi = inject(WalletApiService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly dashboard = signal<CreatorDashboard | null>(null);
  readonly wallet = signal<WalletSummary | null>(null);
  readonly isPublishing = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly alerts = signal<{ id: string; label: string; tone: 'info' | 'success' }[]>([]);
  readonly publishUrl = signal<SafeResourceUrl | null>(null);

  async ngOnInit() {
    if (!this.authApi.isAuthenticated()) {
      return;
    }

    await this.refreshState(true);
    if (this.dashboard()?.room?.slug) {
      this.connectChat(this.dashboard()!.room!.slug);
    }
    this.refreshTimer = setInterval(() => {
      void this.refreshState();
    }, 8000);
  }

  ngOnDestroy() {
    this.chatApi.disconnect();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  startBroadcast() {
    const streamKey = this.dashboard()?.room?.streamKey;
    if (!streamKey || typeof window === 'undefined') {
      return;
    }

    void this.startBroadcastSession(streamKey);
  }

  stopBroadcast() {
    void this.stopBroadcastSession();
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    const roomSlug = this.dashboard()?.room?.slug;
    if (!roomSlug) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;
    const body = input?.value?.trim();
    if (!body) {
      return;
    }

    this.chatApi.sendMessage(roomSlug, body);
    if (input) {
      input.value = '';
    }
  }

  private async refreshState(initialLoad = false) {
    const previousDashboard = this.dashboard();
    const previousWallet = this.wallet();
    const dashboard = await this.creatorApi.getDashboard();
    const wallet = await this.walletApi.getWallet();
    this.dashboard.set(dashboard);
    this.wallet.set(wallet);
    this.syncPublishingState(dashboard);

    if (dashboard.room?.slug && initialLoad) {
      await this.loadChat(dashboard.room.slug);
    }

    if (
      dashboard.stream?.activeSession?.status === 'preparing' &&
      previousDashboard?.stream?.activeSession?.status !== 'preparing'
    ) {
      this.pushAlert('Sesion preparada. Esperando señal real del navegador u OBS.', 'info');
    }

    if (dashboard.stream?.isLive && !previousDashboard?.stream?.isLive) {
      this.pushAlert('La sala ha pasado a online.', 'success');
    }

    if (!dashboard.stream?.isLive && previousDashboard?.stream?.isLive) {
      this.pushAlert('La sala ha vuelto a offline.', 'info');
    }

    const previousTxIds = new Set((previousWallet?.recentTransactions ?? []).map((tx) => tx.id));
    const newTransactions = (wallet.recentTransactions ?? []).filter((tx) => !previousTxIds.has(tx.id));
    newTransactions.forEach((tx) => this.handleTransactionAlert(tx));

    const previousGoal = previousDashboard?.stream?.goals.find((goal) => goal.status === 'active');
    const currentGoal = dashboard.stream?.goals.find((goal) => goal.status === 'active');
    if (currentGoal && previousGoal && currentGoal.currentTokens > previousGoal.currentTokens) {
      this.pushAlert(
        `Goal "${currentGoal.title}" en ${currentGoal.currentTokens}/${currentGoal.targetTokens} NC.`,
        'success',
      );
    }
  }

  private handleTransactionAlert(tx: TokenTransaction) {
    if (tx.type === 'tip_received') {
      this.pushAlert(`Has recibido un tip de ${tx.amount} NC.`, 'success');
    }

    if (tx.type === 'goal_contribution') {
      this.pushAlert(`Nueva contribucion a la goal: ${tx.amount} NC.`, 'success');
    }

    if (tx.type === 'ticket_purchase') {
      this.pushAlert('Se ha vendido un ticket del evento.', 'success');
    }
  }

  private async loadChat(roomSlug: string) {
    this.messages.set(await this.chatApi.getHistory(roomSlug));
  }

  private connectChat(roomSlug: string) {
    this.chatApi.connect(roomSlug, {
      onHistory: (messages) => this.messages.set(messages),
      onMessage: (message) => {
        this.messages.update((current) => [...current, message].slice(-40));
      },
    });
  }

  private pushAlert(label: string, tone: 'info' | 'success') {
    this.alerts.update((current) => [{ id: crypto.randomUUID(), label, tone }, ...current].slice(0, 8));
  }

  private async startBroadcastSession(streamKey: string) {
    try {
      await this.creatorApi.startBroadcast();
      const url = `${window.location.protocol}//${window.location.hostname}:8889/live/${streamKey}/publish`;
      this.publishUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      this.isPublishing.set(true);
      await this.refreshState();
      this.toast.success('Cabina abierta. Si la sala es privada o premium, otros usuarios no la veran libremente.');
      this.pushAlert('Cabina lista para emitir desde navegador.', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la cabina.';
      this.toast.error(message);
      this.pushAlert('No se pudo iniciar la sesion de broadcast.', 'info');
    }
  }

  private async stopBroadcastSession() {
    try {
      await this.creatorApi.stopBroadcast();
      this.isPublishing.set(false);
      this.publishUrl.set(null);
      await this.refreshState();
      this.toast.success('Cabina cerrada. La sesion se ha marcado como finalizada.');
      this.pushAlert('Cabina cerrada. La sesion se ha marcado como finalizada.', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo detener la cabina.';
      this.toast.error(message);
    }
  }

  private syncPublishingState(dashboard: CreatorDashboard) {
    const session = dashboard.stream?.activeSession;
    const isBrowserSession = session?.source === 'browser' && session.status !== 'ended';

    this.isPublishing.set(Boolean(isBrowserSession));

    if (!isBrowserSession) {
      this.publishUrl.set(null);
      return;
    }

    if (this.publishUrl() || typeof window === 'undefined' || !dashboard.room?.streamKey) {
      return;
    }

    const url = `${window.location.protocol}//${window.location.hostname}:8889/live/${dashboard.room.streamKey}/publish`;
    this.publishUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  streamPresenceLabel(dashboard: CreatorDashboard) {
    const presence = resolveStreamRoomPresence({
      isLive: dashboard.stream?.isLive,
      activeSessionStatus: dashboard.stream?.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'online';
    if (presence === 'preparing') return 'preparing';
    return 'offline';
  }
}
