import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SectionTabOption<T extends string = string> = {
  id: T;
  label: string;
};

@Component({
  selector: 'app-section-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-tabs" [class.studio-tabs-inline]="inline">
      <button
        *ngFor="let tab of tabs"
        type="button"
        class="section-tab"
        [class.active]="activeId === tab.id"
        (click)="activeIdChange.emit(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
  `,
})
export class SectionTabsComponent<T extends string = string> {
  @Input({ required: true }) tabs: SectionTabOption<T>[] = [];
  @Input({ required: true }) activeId!: T;
  @Input() inline = false;
  @Output() readonly activeIdChange = new EventEmitter<T>();
}
