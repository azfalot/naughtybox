import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveStreamRoomPresence, StreamDetails } from '@naughtybox/shared-types';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';
import { StreamPlayerComponent } from '../../../ui/media/stream-player.component';

type TicketedEvent = NonNullable<StreamDetails['activeEvent']>;

@Component({
  selector: 'app-stream-stage',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent, AppIconComponent],
  template: `
    <section *ngIf="stream" class="stream-stage-shell panel-card">
      <div class="stream-stage-header">
        <div class="stream-stage-copy">
          <p class="eyebrow">Premium room</p>
          <h2 class="stream-stage-title">{{ stream.title }}</h2>
          <p class="muted stream-stage-subtitle">
            {{ stream.creatorName }} · {{ accessModeLabel() }} · {{ playbackModeLabel() }}
          </p>
        </div>
        <div class="stream-stage-pills">
          <span [class]="statusBadgeClass()">{{ statusLabel() }}</span>
          <span class="viewer-pill">{{ stream.currentViewers || 0 }} viendo</span>
        </div>
      </div>

      <div class="video-frame gated-frame">
        <app-stream-player
          *ngIf="showPlayer"
          [src]="playbackUrl"
          [mode]="playbackMode"
          [controls]="true"
          [muted]="true"
        />

        <div *ngIf="showPreparingState" class="offline-state premium-state" data-testid="stream-state-preparing">
          <div class="offline-copy premium-state-copy">
            <p class="eyebrow">Preparando</p>
            <h2 class="mini-title">La sala está iniciando la emisión</h2>
            <p class="muted">{{ preparingCopy }}</p>
            <div class="studio-actions">
              <button type="button" class="action-button action-button-ghost" (click)="toggleFollow.emit()">
                <app-icon name="heart" [size]="14"></app-icon>
                {{ stream.following ? 'Siguiendo' : 'Seguir' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="showEndedState" class="offline-state premium-state" data-testid="stream-state-ended">
          <div class="offline-copy premium-state-copy">
            <p class="eyebrow">Emisión finalizada</p>
            <h2 class="mini-title">El directo ha terminado</h2>
            <p class="muted">{{ endedCopy }}</p>
            <div class="studio-actions">
              <button type="button" class="action-button action-button-ghost" (click)="toggleFollow.emit()">
                <app-icon name="heart" [size]="14"></app-icon>
                {{ stream.following ? 'Siguiendo' : 'Seguir' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="showOfflineState" class="offline-state premium-state" data-testid="stream-state-offline">
          <div class="offline-copy premium-state-copy">
            <p class="eyebrow">Offline</p>
            <h2 class="mini-title">Ahora mismo no está emitiendo</h2>
            <p class="muted">{{ offlineCopy }}</p>
            <div class="studio-actions">
              <button type="button" class="action-button action-button-ghost" (click)="toggleFollow.emit()">
                <app-icon name="heart" [size]="14"></app-icon>
                {{ stream.following ? 'Siguiendo' : 'Seguir' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="showAccessGate" class="access-gate premium-state" data-testid="stream-state-access-gate">
          <div class="premium-state-copy">
            <p class="eyebrow">Acceso</p>
            <h2 class="mini-title">{{ accessHeadline }}</h2>
            <p class="muted">{{ accessCopy }}</p>
            <div class="studio-actions">
              <button *ngIf="showSubscribeAction" type="button" class="text-link" (click)="subscribe.emit()">
                Membership {{ stream.viewerAccess?.memberMonthlyTokens }} NC
              </button>
              <button *ngIf="showBuyTicketAction" type="button" class="text-link" (click)="buyTicket.emit()">
                Ticket {{ activeEvent?.ticketPrice }} NC
              </button>
              <button
                *ngIf="showPrivateRequestAction"
                type="button"
                class="text-link"
                (click)="requestPrivateShow.emit()"
              >
                Pedir private {{ stream.viewerAccess?.privateEntryTokens }} NC/min
              </button>
              <a *ngIf="!authenticated" class="text-link" routerLink="/login">Entrar</a>
            </div>
          </div>
        </div>
      </div>

      <div class="stream-stage-footnote">
        <span class="muted">Session-aware state: la room solo expone playback y chat cuando la sesión está realmente viva.</span>
        <button type="button" class="action-button action-button-ghost" (click)="toggleFollow.emit()">
          <app-icon name="heart" [size]="14"></app-icon>
          {{ stream.following ? 'Siguiendo' : 'Seguir' }}
        </button>
      </div>
    </section>
  `,
})
export class StreamStageComponent {
  @Input() stream: StreamDetails | null = null;
  @Input() showPlayer = false;
  @Input() showPreparingState = false;
  @Input() showEndedState = false;
  @Input() showOfflineState = false;
  @Input() showAccessGate = false;
  @Input() playbackUrl = '';
  @Input() playbackMode: 'hls' | 'webrtc' = 'hls';
  @Input() offlineCopy = '';
  @Input() preparingCopy = '';
  @Input() endedCopy = '';
  @Input() accessHeadline = '';
  @Input() accessCopy = '';
  @Input() authenticated = false;
  @Input() activeEvent: TicketedEvent | null = null;
  @Input() showSubscribeAction = false;
  @Input() showBuyTicketAction = false;
  @Input() showPrivateRequestAction = false;
  @Output() readonly toggleFollow = new EventEmitter<void>();
  @Output() readonly subscribe = new EventEmitter<void>();
  @Output() readonly buyTicket = new EventEmitter<void>();
  @Output() readonly requestPrivateShow = new EventEmitter<void>();

  statusLabel() {
    if (!this.stream) return 'Offline';
    const presence = resolveStreamRoomPresence({
      isLive: this.stream.isLive,
      activeSessionStatus: this.stream.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'En directo';
    if (presence === 'preparing') return 'Preparando';
    if (presence === 'ended') return 'Finalizada';
    return 'Offline';
  }

  statusBadgeClass() {
    if (!this.stream) return 'badge-offline';
    const presence = resolveStreamRoomPresence({
      isLive: this.stream.isLive,
      activeSessionStatus: this.stream.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'badge-live';
    if (presence === 'preparing') return 'badge-private';
    if (presence === 'ended') return 'badge-ended';
    return 'badge-offline';
  }

  accessModeLabel() {
    if (!this.stream) return 'acceso publico';
    if (this.stream.accessMode === 'premium_membership_required') return 'members only';
    if (this.stream.accessMode === 'ticketed_event') return 'ticketed event';
    if (this.stream.accessMode === 'private_exclusive') return 'private room';
    return 'public room';
  }

  playbackModeLabel() {
    return this.playbackMode === 'webrtc' ? 'WebRTC first' : 'HLS ready';
  }
}
