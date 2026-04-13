import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppIconComponent } from '../ui/icons/app-icon.component';

type ToastItem = {
  message: string;
  tone: 'info' | 'success' | 'error';
};

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <section class="toast-stack" *ngIf="items.length">
      <article
        class="toast"
        *ngFor="let item of items"
        [class.toast-error]="item.tone === 'error'"
        [class.toast-success]="item.tone === 'success'"
      >
        <app-icon
          [name]="item.tone === 'error' ? 'report' : item.tone === 'success' ? 'spark' : 'shield'"
          [size]="16"
        ></app-icon>
        <span>{{ item.message }}</span>
      </article>
    </section>
  `,
})
export class ToastStackComponent {
  @Input() items: ToastItem[] = [];
}
