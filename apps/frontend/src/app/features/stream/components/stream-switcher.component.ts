import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StreamSummary } from '@naughtybox/shared-types';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-stream-switcher',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <section class="stream-switcher" *ngIf="previous || next">
      <button
        type="button"
        class="action-button action-button-ghost"
        *ngIf="previous as previousStream"
        (click)="navigate.emit(previousStream.slug)"
      >
        <app-icon name="chevron-left" [size]="14"></app-icon>
        <span>{{ previousStream.creatorName }}</span>
      </button>
      <button
        type="button"
        class="action-button action-button-ghost"
        *ngIf="next as nextStream"
        (click)="navigate.emit(nextStream.slug)"
      >
        <span>{{ nextStream.creatorName }}</span>
        <app-icon name="chevron-right" [size]="14"></app-icon>
      </button>
    </section>
  `,
})
export class StreamSwitcherComponent {
  @Input() previous: StreamSummary | null = null;
  @Input() next: StreamSummary | null = null;
  @Output() readonly navigate = new EventEmitter<string>();
}
