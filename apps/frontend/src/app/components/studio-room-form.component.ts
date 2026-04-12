import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorDashboard, UpsertCreatorRoomRequest } from '@naughtybox/shared-types';

@Component({
  selector: 'app-studio-room-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel-card">
      <h2 class="mini-title">Sala publica</h2>
      <form class="studio-form" (submit)="onSubmit($event)">
        <label>
          <span>Titulo</span>
          <input name="title" [value]="dashboard?.room?.title ?? ''" />
        </label>
        <label>
          <span>Acceso</span>
          <input name="accessMode" [value]="dashboard?.room?.accessMode ?? 'public'" />
        </label>
        <label>
          <span>Chat</span>
          <input name="chatMode" [value]="dashboard?.room?.chatMode ?? 'registered'" />
        </label>
        <label>
          <span>Tags</span>
          <input name="tags" [value]="(dashboard?.room?.tags ?? []).join(', ')" />
        </label>
        <label>
          <span>Precio privado</span>
          <input name="privateEntryTokens" type="number" min="1" [value]="dashboard?.room?.privateEntryTokens ?? 120" />
        </label>
        <label>
          <span>Precio mensual</span>
          <input name="memberMonthlyTokens" type="number" min="1" [value]="dashboard?.room?.memberMonthlyTokens ?? 450" />
        </label>
        <label class="studio-span">
          <span>Descripcion</span>
          <textarea name="description">{{ dashboard?.room?.description ?? '' }}</textarea>
        </label>
        <button type="submit">Guardar sala</button>
      </form>
    </section>
  `,
})
export class StudioRoomFormComponent {
  @Input() dashboard: CreatorDashboard | null = null;
  @Output() save = new EventEmitter<UpsertCreatorRoomRequest>();

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    this.save.emit({
      title: (form.elements.namedItem('title') as HTMLInputElement)?.value ?? '',
      description: (form.elements.namedItem('description') as HTMLTextAreaElement)?.value ?? '',
      tags: this.splitTags((form.elements.namedItem('tags') as HTMLInputElement)?.value ?? ''),
      accessMode: ((form.elements.namedItem('accessMode') as HTMLInputElement)?.value ?? 'public') as 'public' | 'premium' | 'private',
      chatMode: ((form.elements.namedItem('chatMode') as HTMLInputElement)?.value ?? 'registered') as 'registered' | 'members' | 'tippers',
      privateEntryTokens: Number((form.elements.namedItem('privateEntryTokens') as HTMLInputElement)?.value || 120),
      memberMonthlyTokens: Number((form.elements.namedItem('memberMonthlyTokens') as HTMLInputElement)?.value || 450),
    });
  }

  private splitTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
