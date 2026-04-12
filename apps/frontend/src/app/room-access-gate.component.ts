import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-room-access-gate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="access-gate-inner">
      <span class="access-gate-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="19" width="24" height="17" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M13 19v-5a7 7 0 0 1 14 0v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="20" cy="28" r="2.5" fill="currentColor"/>
          <line x1="20" y1="30.5" x2="20" y2="33" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>

      <p class="eyebrow access-gate-eyebrow">{{ eyebrow }}</p>
      <h2 class="access-gate-headline">{{ headline }}</h2>
      <p class="access-gate-copy">{{ copy }}</p>

      <div class="access-gate-actions" *ngIf="isAuthenticated; else loginCta">
        <button
          *ngIf="canUnlock && privateTokens"
          type="button"
          class="access-gate-btn access-gate-btn-ghost"
          (click)="unlockClicked.emit()"
        >
          Desbloquear &mdash; {{ privateTokens }} tokens
        </button>
        <button
          *ngIf="memberTokens"
          type="button"
          class="access-gate-btn access-gate-btn-primary"
          (click)="subscribeClicked.emit()"
        >
          Suscribirme &mdash; {{ memberTokens }} tokens / mes
        </button>
      </div>

      <ng-template #loginCta>
        <div class="access-gate-actions">
          <a class="access-gate-btn access-gate-btn-primary" routerLink="/login">Entrar para acceder</a>
        </div>
      </ng-template>
    </div>
  `,
})
export class RoomAccessGateComponent {
  @Input() eyebrow = 'Contenido exclusivo';
  @Input({ required: true }) headline!: string;
  @Input({ required: true }) copy!: string;
  @Input() privateTokens?: number;
  @Input() memberTokens?: number;
  @Input() isAuthenticated = false;
  @Input() canUnlock = false;

  @Output() unlockClicked = new EventEmitter<void>();
  @Output() subscribeClicked = new EventEmitter<void>();
}
