import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CreatorPublicProfile,
  Goal,
  resolveStreamRoomPresence,
  StreamDetails,
  TicketedEvent,
} from '@naughtybox/shared-types';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-stream-details-panel',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <section class="panel-card room-summary room-summary-page" *ngIf="stream && profile">
      <div class="room-summary-head">
        <div class="room-summary-copy">
          <h1>{{ stream.title }}</h1>
          <p class="muted room-kicker">{{ stream.creatorName }} · {{ stream.description }}</p>
        </div>
        <div class="room-status-pills room-status-pills-compact">
          <span [class]="statusBadgeClass(stream)" data-testid="stream-status-badge">{{ statusLabel(stream) }}</span>
          <span class="viewer-pill">{{ stream.currentViewers || 0 }} viendo</span>
          <span class="viewer-pill">{{ accessModeLabel(stream.accessMode) }}</span>
          <span class="viewer-pill">{{ playbackModeLabel }}</span>
          <button
            type="button"
            class="icon-button icon-button-compact"
            (click)="openReport.emit()"
            title="Reportar sala"
          >
            <app-icon name="report" [size]="14"></app-icon>
          </button>
          <button type="button" class="action-button action-button-ghost" (click)="toggleFollow.emit()">
            <app-icon name="heart" [size]="14"></app-icon>
            {{ stream.following ? 'Siguiendo' : 'Seguir' }}
          </button>
        </div>
      </div>

      <div class="creator-grid creator-grid-tight">
        <div>
          <p class="muted stat-label">Categorías</p>
          <strong>{{ profile.categories.join(' · ') || 'General' }}</strong>
        </div>
        <div>
          <p class="muted stat-label">País</p>
          <strong>{{ profile.country || 'Sin definir' }}</strong>
        </div>
        <div>
          <p class="muted stat-label">Chat</p>
          <strong>{{ chatModeLabel(stream.viewerAccess?.chatMode) }}</strong>
        </div>
        <div>
          <p class="muted stat-label">Sesión</p>
          <strong>{{ sessionLabel(stream) }}</strong>
        </div>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="activeGoal || queuedGoals.length">
      <div class="profile-section-header">
        <div>
          <h2 class="mini-title">Metas de sesión</h2>
          <p class="muted">Las metas viven dentro de la sesión activa y se reinician con cada nuevo directo.</p>
        </div>
        <span *ngIf="activeGoal" class="viewer-pill token-pill"
          ><span class="token-dot">◉</span>{{ remainingGoalTokens }} NC restantes</span
        >
      </div>
      <div *ngIf="activeGoal as goal" class="goal-card">
        <div class="stack-item-head">
          <div>
            <strong>{{ goal.title }}</strong>
            <p class="muted">{{ goal.description || goal.actionLabel }}</p>
          </div>
          <span class="status-tag status-tag-vip">active</span>
        </div>
        <div class="goal-progress"><div class="goal-progress-bar" [style.width.%]="goalProgressPercent"></div></div>
        <div class="goal-meta">
          <span>{{ goal.currentTokens }} / {{ goal.targetTokens }} NC</span><span>{{ goal.actionLabel }}</span>
        </div>
        <div class="studio-actions" *ngIf="authenticated">
          <button type="button" class="action-button action-button-warn" (click)="contributeGoal.emit(25)">
            +25 NC
          </button>
          <button type="button" class="action-button action-button-warn" (click)="contributeGoal.emit(100)">
            +100 NC
          </button>
        </div>
      </div>
      <div class="stack-list compact-stack" *ngIf="queuedGoals.length">
        <article class="stack-item" *ngFor="let goal of queuedGoals">
          <div class="stack-item-head">
            <strong>{{ goal.title }}</strong>
            <span class="viewer-pill">cola #{{ goal.queuePosition }}</span>
          </div>
          <p class="muted">{{ goal.targetTokens }} NC · {{ goal.actionLabel }}</p>
        </article>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="activeEvent">
      <div class="profile-section-header">
        <div>
          <h2 class="mini-title">Evento con ticket</h2>
          <p class="muted">{{ activeEvent.description || 'Evento premium ligado a esta sala.' }}</p>
        </div>
        <span class="viewer-pill token-pill"><span class="token-dot">◉</span>{{ activeEvent.ticketPrice }} NC</span>
      </div>
      <div class="creator-grid">
        <div>
          <p class="muted stat-label">Estado</p>
          <strong>{{ activeEventLabel(activeEvent.status) }}</strong>
        </div>
        <div>
          <p class="muted stat-label">Miembros</p>
          <strong>{{ activeEvent.allowMemberAccess ? 'incluye miembros' : 'solo ticket' }}</strong>
        </div>
        <div>
          <p class="muted stat-label">Arranque</p>
          <strong>{{ activeEvent.startsAt ? formatDate(activeEvent.startsAt) : 'cuando decida el creador' }}</strong>
        </div>
      </div>
      <div class="studio-actions" *ngIf="showBuyTicketAction">
        <button type="button" class="text-link" (click)="buyTicket.emit()">Comprar ticket</button>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="privateRequest">
      <div class="profile-section-header">
        <div>
          <h2 class="mini-title">Private show</h2>
          <p class="muted">Modo exclusivo 1:1 sin spies en MVP.</p>
        </div>
        <span class="viewer-pill">{{ privateRequest.status }}</span>
      </div>
      <p class="muted">
        Solicitado por {{ privateRequest.requesterUsername }} · {{ privateRequest.tokensPerMinute }} NC/min
      </p>
    </section>
  `,
})
export class StreamDetailsPanelComponent {
  @Input() stream: StreamDetails | null = null;
  @Input() profile: CreatorPublicProfile | null = null;
  @Input() activeGoal: Goal | null = null;
  @Input() queuedGoals: Goal[] = [];
  @Input() activeEvent: TicketedEvent | null = null;
  @Input() privateRequest: StreamDetails['privateShowRequest'] | null = null;
  @Input() remainingGoalTokens = 0;
  @Input() goalProgressPercent = 0;
  @Input() playbackModeLabel = 'HLS';
  @Input() showBuyTicketAction = false;
  @Input() authenticated = false;
  @Output() readonly openReport = new EventEmitter<void>();
  @Output() readonly toggleFollow = new EventEmitter<void>();
  @Output() readonly contributeGoal = new EventEmitter<number>();
  @Output() readonly buyTicket = new EventEmitter<void>();

  accessModeLabel(mode?: string) {
    if (mode === 'premium_membership_required') return 'premium';
    if (mode === 'ticketed_event') return 'ticketed';
    if (mode === 'private_exclusive') return 'private';
    return 'public';
  }

  chatModeLabel(mode?: string) {
    if (mode === 'members') return 'members';
    if (mode === 'tippers') return 'tippers';
    if (mode === 'ticket_holders') return 'ticket holders';
    if (mode === 'private_only') return 'private only';
    return 'registered';
  }

  statusLabel(stream: StreamDetails) {
    const presence = resolveStreamRoomPresence({
      isLive: stream.isLive,
      activeSessionStatus: stream.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'En directo';
    if (presence === 'preparing') return 'Preparando';
    return 'Offline';
  }

  statusBadgeClass(stream: StreamDetails) {
    const presence = resolveStreamRoomPresence({
      isLive: stream.isLive,
      activeSessionStatus: stream.activeSession?.status ?? null,
    });
    if (presence === 'live') return 'badge-live';
    if (presence === 'preparing') return 'badge-private';
    return 'badge-offline';
  }

  sessionLabel(stream: StreamDetails) {
    if (!stream.activeSession) return 'sin directo';
    if (stream.activeSession.status === 'preparing') return 'preparando';
    if (stream.activeSession.status === 'live') return 'activa';
    return 'cerrada';
  }

  activeEventLabel(value: TicketedEvent['status']) {
    if (value === 'scheduled') return 'programado';
    if (value === 'active') return 'activo';
    if (value === 'ended') return 'cerrado';
    if (value === 'cancelled') return 'cancelado';
    if (value === 'draft') return 'borrador';
    return value;
  }

  formatDate(value: string) {
    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
