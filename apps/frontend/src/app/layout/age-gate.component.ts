import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-age-gate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section *ngIf="visible" class="age-gate-backdrop">
      <div class="panel-card age-gate-card">
        <p class="eyebrow">18+ only</p>
        <h2 class="mini-title" style="margin-bottom: 8px;">Acceso restringido a adultos</h2>
        <p class="muted">
          Naughtybox es una plataforma para mayores de edad. Al continuar declaras que tienes 18 anos o mas y aceptas
          revisar nuestras normas basicas.
        </p>
        <div class="age-gate-actions">
          <button type="button" class="text-link text-link-solid" (click)="confirm.emit()">Soy mayor de edad</button>
          <a class="text-link" href="https://www.google.es" rel="noreferrer">Salir</a>
        </div>
        <div class="age-gate-links">
          <a routerLink="/legal/terms">Terminos</a>
          <a routerLink="/legal/privacy">Privacidad</a>
          <a routerLink="/legal/cookies">Cookies</a>
          <a routerLink="/legal/18plus">Seguridad 18+</a>
        </div>
      </div>
    </section>
  `,
})
export class AgeGateComponent {
  @Input() visible = false;
  @Output() readonly confirm = new EventEmitter<void>();
}
