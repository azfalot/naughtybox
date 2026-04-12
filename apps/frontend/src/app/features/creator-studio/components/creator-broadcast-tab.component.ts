import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorDashboard } from '@naughtybox/shared-types';
import { CreatorBrowserBroadcastSectionComponent } from './creator-browser-broadcast-section.component';
import { CreatorObsSettingsSectionComponent } from './creator-obs-settings-section.component';
import { CreatorRoomFormSectionComponent } from './creator-room-form-section.component';

@Component({
  selector: 'app-creator-broadcast-tab',
  standalone: true,
  imports: [
    CommonModule,
    CreatorRoomFormSectionComponent,
    CreatorBrowserBroadcastSectionComponent,
    CreatorObsSettingsSectionComponent,
  ],
  template: `
    <app-creator-room-form-section [room]="dashboard?.room ?? null" (save)="saveRoom.emit($event)"></app-creator-room-form-section>

    <app-creator-browser-broadcast-section *ngIf="dashboard?.room"></app-creator-browser-broadcast-section>

    <app-creator-obs-settings-section
      [room]="dashboard?.room ?? null"
      (rotateStreamKey)="rotateStreamKey.emit()"
    ></app-creator-obs-settings-section>
  `,
})
export class CreatorBroadcastTabComponent {
  @Input() dashboard: CreatorDashboard | null = null;
  @Output() readonly saveRoom = new EventEmitter<Event>();
  @Output() readonly rotateStreamKey = new EventEmitter<void>();
}
