import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      *ngIf="name === 'heart'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z"></path>
    </svg>
    <svg
      *ngIf="name === 'coin'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8"></circle>
      <path d="M9.5 9.5h5M9.5 14.5h5"></path>
    </svg>
    <svg
      *ngIf="name === 'shield'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 3 19 6v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Z"></path>
    </svg>
    <svg
      *ngIf="name === 'user'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="8" r="3.2"></circle>
      <path d="M5.5 19c1.5-3.1 4.1-4.7 6.5-4.7s5 1.6 6.5 4.7"></path>
    </svg>
    <svg
      *ngIf="name === 'camera'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3.5" y="7" width="13" height="10" rx="2"></rect>
      <path d="m16.5 10 4-2v8l-4-2"></path>
    </svg>
    <svg
      *ngIf="name === 'report'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 4v16"></path>
      <path d="M5 5h10l-2 4 2 4H5"></path>
    </svg>
    <svg
      *ngIf="name === 'gift'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 12v8H4v-8"></path>
      <path d="M2 7h20v5H2z"></path>
      <path d="M12 7v13"></path>
      <path d="M12 7c-1.5 0-4-1-4-3a2 2 0 0 1 4 0c0-1.5 1-4 3-4a2 2 0 0 1 0 4c-1.5 0-3 1.5-3 3Z"></path>
    </svg>
    <svg
      *ngIf="name === 'spark'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"></path>
    </svg>
    <svg
      *ngIf="name === 'chevron-left'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6"></path>
    </svg>
    <svg
      *ngIf="name === 'chevron-right'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6"></path>
    </svg>
    <svg
      *ngIf="name === 'close'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18"></path>
    </svg>
    <svg
      *ngIf="name === 'ban'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8"></circle>
      <path d="M8.5 8.5l7 7"></path>
    </svg>
    <svg
      *ngIf="name === 'image'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <circle cx="9" cy="10" r="1.5"></circle>
      <path d="m21 15-4.5-4.5L8 19"></path>
    </svg>
    <svg
      *ngIf="name === 'instagram'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="4"></rect>
      <circle cx="12" cy="12" r="3.5"></circle>
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none"></circle>
    </svg>
    <svg
      *ngIf="name === 'x-social'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 4h3.2l10.8 16H15.8L5 4Z"></path>
      <path d="m19 4-5.7 6.4"></path>
      <path d="M10.7 13.2 5 20"></path>
    </svg>
    <svg
      *ngIf="name === 'onlyfans'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M5 14.5c2.2-3.8 5.1-6 8.6-6 2.9 0 5.4 1.3 5.4 4.1 0 3.6-3.6 6.4-8.2 6.4-3.7 0-5.8-1.9-5.8-4.5 0-2.2 1.8-4 4.2-4 1.7 0 3 1.2 3 2.9 0 1.6-1.1 2.8-2.6 2.8"
      ></path>
      <circle cx="9.2" cy="14.6" r="1.5"></circle>
    </svg>
    <svg
      *ngIf="name === 'globe'"
      viewBox="0 0 24 24"
      class="app-icon"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8"></circle>
      <path d="M4.5 9h15"></path>
      <path d="M4.5 15h15"></path>
      <path d="M12 4c2 2.1 3.2 4.8 3.2 8S14 17.9 12 20c-2-2.1-3.2-4.8-3.2-8S10 6.1 12 4Z"></path>
    </svg>
  `,
})
export class AppIconComponent {
  @Input() name:
    | 'heart'
    | 'coin'
    | 'shield'
    | 'user'
    | 'camera'
    | 'report'
    | 'gift'
    | 'spark'
    | 'chevron-left'
    | 'chevron-right'
    | 'close'
    | 'ban'
    | 'image'
    | 'instagram'
    | 'x-social'
    | 'onlyfans'
    | 'globe' = 'user';
  @Input() size = 16;
}
