import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatMessage, StreamDetails, WalletSummary } from '@naughtybox/shared-types';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-stream-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <aside class="stream-sidebar" *ngIf="stream">
      <section class="panel-card chat-panel">
        <div class="chat-header">
          <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
          <span class="muted">{{ chatModeText }}</span>
        </div>
        <div class="chat-messages">
          <article class="chat-message" *ngFor="let message of messages">
            <div class="chat-line">
              <strong>{{ message.authorName }}</strong>
            </div>
            <p>{{ message.body }}</p>
          </article>
        </div>
        <form *ngIf="canChat; else loginForChat" class="chat-form" (submit)="sendMessage.emit($event)">
          <input type="text" name="message" placeholder="Escribe un mensaje o emoji..." />
          <button type="submit">Enviar</button>
        </form>
        <ng-template #loginForChat>
          <div class="chat-locked">
            <p class="muted">{{ chatLockMessage }}</p>
            <div
              class="panel-card"
              *ngIf="stream.roomRules && authenticated && stream.viewerAccess?.canWatch"
              style="padding: 12px; margin-top: 12px;"
            >
              <p class="muted" style="margin-bottom: 8px;">Reglas de la sala</p>
              <p>{{ stream.roomRules }}</p>
            </div>
            <div class="studio-actions" *ngIf="stream.isLive">
              <a *ngIf="!authenticated" class="text-link" routerLink="/login">Entrar</a>
              <button
                *ngIf="showSubscribeAction && authenticated"
                type="button"
                class="text-link"
                (click)="subscribe.emit()"
              >
                Suscribirme
              </button>
              <button
                *ngIf="showBuyTicketAction && authenticated"
                type="button"
                class="text-link"
                (click)="buyTicket.emit()"
              >
                Comprar ticket
              </button>
            </div>
          </div>
        </ng-template>
      </section>

      <section class="panel-card" *ngIf="authenticated">
        <div class="chat-header">
          <h2 class="mini-title" style="margin: 0;">Wallet</h2>
          <span class="viewer-pill token-pill"><span class="token-dot">◉</span>{{ wallet?.balance ?? 0 }} NC</span>
        </div>
        <div class="tip-controls" style="margin-top: 12px;">
          <button type="button" class="text-link" (click)="addDevCredit.emit()">Recarga dev +250</button>
          <input type="number" min="1" [value]="tipAmount" (input)="tipAmountInput.emit($event)" />
          <button type="button" class="text-link" (click)="tip.emit()">Enviar tip</button>
        </div>
        <ul class="helper-list" style="margin-top: 14px;" *ngIf="wallet?.recentTransactions?.length">
          <li *ngFor="let transaction of wallet!.recentTransactions.slice(0, 5)">
            {{ transaction.type }} · {{ transaction.amount }} · {{ transaction.balanceAfter }}
          </li>
        </ul>
      </section>

      <section class="panel-card">
        <div class="profile-section-header">
          <h2 class="mini-title">Trust & Safety</h2>
          <a class="action-button action-button-warn" routerLink="/legal/18plus">Security Center</a>
        </div>
        <p class="muted">
          El reporte de sala vive en un boton pequeno junto al header del streaming para no romper la experiencia.
        </p>
        <div class="studio-actions" style="margin-top: 12px;">
          <button type="button" class="action-button action-button-warn" (click)="openReport.emit()">
            <app-icon name="report" [size]="14"></app-icon>Reportar sala
          </button>
        </div>
      </section>

      <section class="panel-card" *ngIf="canModerateRoom">
        <div class="profile-section-header">
          <div>
            <h2 class="mini-title">Moderacion de sala</h2>
            <p class="muted">Silencia o reporta espectadores molestos sin salir del directo.</p>
          </div>
        </div>
        <form class="report-form" (submit)="muteViewer.emit($event)">
          <label><span>Usuario</span><input name="targetUsername" placeholder="username" /></label>
          <label><span>Motivo del mute</span><input name="reason" placeholder="Spam, acoso, insultos..." /></label>
          <label
            ><span>Duracion (horas)</span><input name="durationHours" type="number" min="1" max="168" value="24"
          /></label>
          <button type="submit" class="action-button action-button-warn">
            <app-icon name="ban" [size]="14"></app-icon>Silenciar
          </button>
        </form>
        <form class="report-form" (submit)="reportViewer.emit($event)" style="margin-top: 12px;">
          <label><span>Usuario a reportar</span><input name="targetUsername" placeholder="username" /></label>
          <label
            ><span>Motivo</span
            ><select name="reason">
              <option value="harassment">Acoso</option>
              <option value="fraud">Fraude</option>
              <option value="dangerous_behavior">Conducta peligrosa</option>
              <option value="underage_risk">Riesgo de menor</option>
              <option value="other">Otro</option>
            </select></label
          >
          <label><span>Detalle</span><textarea name="details" rows="3" placeholder="Que ha ocurrido"></textarea></label>
          <button type="submit" class="action-button action-button-ghost">Escalar a Trust & Safety</button>
        </form>
      </section>

      <section class="panel-card">
        <h2 class="mini-title">Acceso premium</h2>
        <ul class="helper-list">
          <li>Public show: visible para todos, monetizado con tips y goals.</li>
          <li>Private show: 1:1, solo creadora y requester activo.</li>
          <li>Ticketed event: acceso por ticket o membresia si esta permitido.</li>
        </ul>
      </section>

      <p *ngIf="notice" class="studio-notice">{{ notice }}</p>
    </aside>
  `,
})
export class StreamSidebarComponent {
  @Input() stream: StreamDetails | null = null;
  @Input() messages: ChatMessage[] = [];
  @Input() canChat = false;
  @Input() chatModeText = '';
  @Input() chatLockMessage = '';
  @Input() authenticated = false;
  @Input() showSubscribeAction = false;
  @Input() showBuyTicketAction = false;
  @Input() wallet: WalletSummary | null = null;
  @Input() tipAmount = 25;
  @Input() notice = '';
  @Input() canModerateRoom = false;
  @Output() readonly sendMessage = new EventEmitter<Event>();
  @Output() readonly subscribe = new EventEmitter<void>();
  @Output() readonly buyTicket = new EventEmitter<void>();
  @Output() readonly addDevCredit = new EventEmitter<void>();
  @Output() readonly tipAmountInput = new EventEmitter<Event>();
  @Output() readonly tip = new EventEmitter<void>();
  @Output() readonly openReport = new EventEmitter<void>();
  @Output() readonly muteViewer = new EventEmitter<Event>();
  @Output() readonly reportViewer = new EventEmitter<Event>();
}
