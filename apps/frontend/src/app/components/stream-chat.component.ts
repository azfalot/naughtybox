import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatMessage, StreamDetails, WalletSummary } from '@naughtybox/shared-types';

@Component({
  selector: 'app-stream-chat',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel-card chat-panel">
      <div class="chat-header">
        <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
        <span class="muted">{{ stream.viewerAccess?.chatMode || 'registered' }}</span>
      </div>

      <div class="chat-messages">
        <article class="chat-message" *ngFor="let message of messages">
          <strong>{{ message.authorName }}</strong>
          <p>{{ message.body }}</p>
        </article>
      </div>

      <form *ngIf="canChat; else loginForChat" class="chat-form" (submit)="onSendMessage($event)">
        <input type="text" name="message" placeholder="Escribe un mensaje..." />
        <button type="submit">Enviar</button>
      </form>

      <ng-template #loginForChat>
        <div class="chat-locked">
          <p class="muted">{{ chatLockMessage }}</p>
          <div class="studio-actions">
            <a *ngIf="!isAuthenticated" class="text-link" routerLink="/login">Entrar</a>
            <button *ngIf="isAuthenticated" type="button" class="text-link" (click)="unlockPrivate.emit()">Desbloquear</button>
            <button *ngIf="isAuthenticated" type="button" class="text-link" (click)="subscribe.emit()">Suscribirme</button>
          </div>
        </div>
      </ng-template>
    </section>

    <section class="panel-card" *ngIf="isAuthenticated && wallet">
      <div class="chat-header">
        <h2 class="mini-title" style="margin: 0;">Wallet</h2>
        <span class="viewer-pill">{{ wallet.balance }} tokens</span>
      </div>

      <div class="studio-actions" style="margin-top: 12px;">
        <button type="button" class="text-link" (click)="addDevCredit.emit()">Recarga dev +250</button>
        <button type="button" class="text-link" (click)="tip.emit(25)">Tip 25</button>
        <button type="button" class="text-link" (click)="tip.emit(100)">Tip 100</button>
      </div>

      <ul class="helper-list" style="margin-top: 14px;" *ngIf="wallet.recentTransactions?.length">
        <li *ngFor="let transaction of wallet.recentTransactions.slice(0, 5)">
          {{ transaction.type }} · {{ transaction.amount }} · {{ transaction.balanceAfter }}
        </li>
      </ul>
    </section>

    <section class="panel-card">
      <h2 class="mini-title">Acceso premium</h2>
      <ul class="helper-list">
        <li>Privado por tokens o membresia mensual.</li>
        <li>Chat configurable por nivel de acceso.</li>
        <li>Base preparada para ampliar a tippers, members y toys.</li>
      </ul>
    </section>
  `,
})
export class StreamChatComponent {
  @Input({ required: true }) stream!: StreamDetails;
  @Input() messages: ChatMessage[] = [];
  @Input() canChat = false;
  @Input() wallet: WalletSummary | null = null;
  @Input() isAuthenticated = false;
  @Output() messageSent = new EventEmitter<string>();
  @Output() unlockPrivate = new EventEmitter<void>();
  @Output() subscribe = new EventEmitter<void>();
  @Output() addDevCredit = new EventEmitter<void>();
  @Output() tip = new EventEmitter<number>();

  get chatLockMessage(): string {
    const access = this.stream?.viewerAccess;
    if (!this.isAuthenticated) {
      return 'Entra con tu cuenta para acceder al chat y a los desbloqueos premium.';
    }
    if (access?.chatMode === 'members') {
      return 'Este chat es solo para miembros o usuarios con acceso privado activo.';
    }
    if (access?.chatMode === 'tippers') {
      return 'Este chat es solo para tippers, miembros o usuarios con acceso privado.';
    }
    return 'El chat necesita acceso registrado y permisos activos en la sala.';
  }

  onSendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;
    if (!input || !input.value.trim()) {
      return;
    }
    this.messageSent.emit(input.value.trim());
    input.value = '';
  }
}
