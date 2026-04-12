import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatMessage, StreamDetails } from '@naughtybox/shared-types';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-stream-chat-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel-card chat-panel">
      <div class="chat-header">
        <h2 class="mini-title" style="margin: 0;">Chat en vivo</h2>
        <span class="muted">{{ stream?.viewerAccess?.chatMode || 'registered' }}</span>
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
          <p class="muted">{{ chatLockMessage() }}</p>
          <div class="studio-actions">
            <a *ngIf="!authApi.isAuthenticated()" class="text-link" routerLink="/login">Entrar</a>
            <button *ngIf="authApi.isAuthenticated()" type="button" class="text-link" (click)="unlock.emit()">Desbloquear</button>
            <button *ngIf="authApi.isAuthenticated()" type="button" class="text-link" (click)="subscribe.emit()">Suscribirme</button>
          </div>
        </div>
      </ng-template>
    </section>
  `,
})
export class StreamChatPanelComponent {
  @Input() stream: StreamDetails | null = null;
  @Input() messages: ChatMessage[] = [];
  @Input() canChat = false;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() unlock = new EventEmitter<void>();
  @Output() subscribe = new EventEmitter<void>();

  readonly authApi = inject(AuthApiService);

  onSendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;

    if (!input || !input.value.trim()) {
      return;
    }

    this.sendMessage.emit(input.value.trim());
    input.value = '';
  }

  chatLockMessage() {
    const access = this.stream?.viewerAccess;
    if (!this.authApi.isAuthenticated()) {
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
}
