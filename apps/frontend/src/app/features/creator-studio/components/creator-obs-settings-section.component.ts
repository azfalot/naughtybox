import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorRoom } from '@naughtybox/shared-types';

@Component({
  selector: 'app-creator-obs-settings-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel-card" *ngIf="room">
      <div class="profile-section-header">
        <h2 class="mini-title">Emitir con OBS</h2>
        <div class="studio-actions">
          <button type="button" class="action-button action-button-ghost" (click)="rotateStreamKey.emit()">
            Rotar stream key
          </button>
          <a class="text-link" href="https://obsproject.com/es" target="_blank" rel="noreferrer">OBS</a>
        </div>
      </div>
      <ul class="helper-list">
        <li>Ajustes → Emision → Servicio personalizado.</li>
        <li>Servidor RTMP: <span class="inline-code">rtmp://localhost:1935/live</span></li>
        <li>Stream key: <span class="inline-code">{{ room.streamKey }}</span></li>
        <li>Usa H.264 y arranca la emision. Naughtybox creara o reactivara la sesion del directo.</li>
      </ul>
    </section>
  `,
})
export class CreatorObsSettingsSectionComponent {
  @Input() room: CreatorRoom | null = null;
  @Output() readonly rotateStreamKey = new EventEmitter<void>();
}