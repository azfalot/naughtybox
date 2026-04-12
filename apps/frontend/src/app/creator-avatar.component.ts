import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-creator-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="creator-avatar"
      [class.creator-avatar-sm]="size === 'sm'"
      [class.creator-avatar-md]="size === 'md'"
      [class.creator-avatar-lg]="size === 'lg'"
      [class.creator-avatar-live]="isLive"
    >
      {{ monogram() }}
    </span>
  `,
})
export class CreatorAvatarComponent {
  @Input({ required: true }) name!: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() isLive = false;

  monogram() {
    return this.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
