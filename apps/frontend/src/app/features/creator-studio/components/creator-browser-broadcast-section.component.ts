import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-creator-browser-broadcast-section',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <section class="panel-card">
      <div class="profile-section-header">
        <div>
          <h2 class="mini-title">Emitir desde navegador</h2>
          <p class="muted">
            La emision web ahora vive en una cabina separada para que puedas arrancar, ver chat, abrir tu sala y detener
            la emision con menos friccion.
          </p>
        </div>
        <a class="action-button action-button-warn" routerLink="/studio/broadcast"
          ><app-icon name="camera" [size]="14"></app-icon>Abrir cabina</a
        >
      </div>
      <ul class="helper-list">
        <li>Si tu sala esta en modo premium o private, el publico no la vera libremente aunque estes emitiendo.</li>
        <li>La cabina te deja controlar la emision sin meter un iframe gigante dentro del Studio.</li>
        <li>Para overlays, escenas y mezcla avanzada sigue siendo mejor usar OBS.</li>
      </ul>
    </section>
  `,
})
export class CreatorBrowserBroadcastSectionComponent {}