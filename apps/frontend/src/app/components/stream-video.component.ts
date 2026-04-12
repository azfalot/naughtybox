import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamDetails } from '@naughtybox/shared-types';
import { StreamPlayerComponent } from '../stream-player.component';

@Component({
  selector: 'app-stream-video',
  standalone: true,
  imports: [CommonModule, RouterLink, StreamPlayerComponent],
  template: `
    <div class="video-frame gated-frame">
      <app-stream-player
        *ngIf="canWatch"
        [src]="stream.playback.hlsUrl"
        [controls]="true"
        [muted]="false"
      />

      <div *ngIf="!canWatch" class="access-gate">
        <p class="eyebrow">Access</p>
        <h2 class="mini-title">{{ accessHeadline }}</h2>
        <p class="muted">{{ accessCopy }}</p>
        <div class="studio-actions">
          <button
            *ngIf="stream.viewerAccess?.accessMode !== 'public'"
            type="button"
            class="text-link"
            (click)="unlockPrivate.emit()"
          >
            Desbloquear {{ stream.viewerAccess?.privateEntryTokens }} tokens
          </button>
          <button type="button" class="text-link" (click)="subscribe.emit()">
            Suscribirme {{ stream.viewerAccess?.memberMonthlyTokens }} tokens
          </button>
          <a *ngIf="!isAuthenticated" class="text-link" routerLink="/login">Entrar</a>
        </div>
      </div>
    </div>
  `,
})
export class StreamVideoComponent {
  @Input({ required: true }) stream!: StreamDetails;
  @Input() canWatch = true;
  @Input() isAuthenticated = false;
  @Output() unlockPrivate = new EventEmitter<void>();
  @Output() subscribe = new EventEmitter<void>();

  get accessHeadline(): string {
    return this.stream?.viewerAccess?.accessMode === 'private' ? 'Show privado' : 'Contenido premium';
  }

  get accessCopy(): string {
    const access = this.stream?.viewerAccess;
    if (!access) {
      return 'Necesitas acceso para entrar en esta sala.';
    }
    if (access.accessMode === 'private') {
      return `Desbloquea el directo por ${access.privateEntryTokens} tokens o suscribete por ${access.memberMonthlyTokens} tokens al mes.`;
    }
    return `Suscribete por ${access.memberMonthlyTokens} tokens al mes para ver y chatear con acceso premium.`;
  }
}
