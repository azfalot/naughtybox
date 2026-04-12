import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorProfile, UpsertCreatorProfileRequest } from '@naughtybox/shared-types';

@Component({
  selector: 'app-studio-profile-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel-card">
      <h2 class="mini-title">Perfil de creadora</h2>
      <form class="studio-form" (submit)="onSubmit($event)">
        <label>
          <span>Display name</span>
          <input name="displayName" [value]="profile?.displayName ?? fallbackName ?? ''" />
        </label>
        <label>
          <span>Slug</span>
          <input name="slug" [value]="profile?.slug ?? fallbackName ?? ''" />
        </label>
        <label>
          <span>Edad</span>
          <input name="age" type="number" min="18" [value]="profile?.age ?? ''" />
        </label>
        <label>
          <span>Genero</span>
          <input name="gender" [value]="profile?.gender ?? ''" />
        </label>
        <label>
          <span>Pais</span>
          <input name="country" [value]="profile?.country ?? ''" />
        </label>
        <label>
          <span>Ciudad</span>
          <input name="city" [value]="profile?.city ?? ''" />
        </label>
        <label>
          <span>Interesada en</span>
          <input name="interestedIn" [value]="profile?.interestedIn ?? ''" />
        </label>
        <label>
          <span>Relacion</span>
          <input name="relationshipStatus" [value]="profile?.relationshipStatus ?? ''" />
        </label>
        <label>
          <span>Body type</span>
          <input name="bodyType" [value]="profile?.bodyType ?? ''" />
        </label>
        <label>
          <span>Accent color</span>
          <input name="accentColor" [value]="profile?.accentColor ?? '#ff5b73'" />
        </label>
        <label>
          <span>Avatar URL</span>
          <input name="avatarUrl" [value]="profile?.avatarUrl ?? ''" />
        </label>
        <label>
          <span>Cover URL</span>
          <input name="coverImageUrl" [value]="profile?.coverImageUrl ?? ''" />
        </label>
        <label class="studio-span">
          <span>Bio</span>
          <textarea name="bio">{{ profile?.bio ?? '' }}</textarea>
        </label>
        <label class="studio-span">
          <span>Idiomas</span>
          <input name="languages" [value]="(profile?.languages ?? []).join(', ')" />
        </label>
        <label class="studio-span">
          <span>Categorias</span>
          <input name="categories" [value]="(profile?.categories ?? []).join(', ')" />
        </label>
        <label class="studio-span">
          <span>Subcategorias</span>
          <input name="subcategories" [value]="(profile?.subcategories ?? []).join(', ')" />
        </label>
        <label class="studio-span">
          <span>Tags</span>
          <input name="tags" [value]="(profile?.tags ?? []).join(', ')" />
        </label>
        <label>
          <span>Instagram</span>
          <input name="instagramUrl" [value]="profile?.instagramUrl ?? ''" />
        </label>
        <label>
          <span>X / Twitter</span>
          <input name="xUrl" [value]="profile?.xUrl ?? ''" />
        </label>
        <label>
          <span>OnlyFans</span>
          <input name="onlyFansUrl" [value]="profile?.onlyFansUrl ?? ''" />
        </label>
        <label>
          <span>Website</span>
          <input name="websiteUrl" [value]="profile?.websiteUrl ?? ''" />
        </label>
        <button type="submit">Guardar perfil</button>
      </form>
    </section>
  `,
})
export class StudioProfileFormComponent {
  @Input() profile: CreatorProfile | null | undefined = null;
  @Input() fallbackName: string | null | undefined = null;
  @Output() save = new EventEmitter<UpsertCreatorProfileRequest>();

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    this.save.emit({
      displayName: (form.elements.namedItem('displayName') as HTMLInputElement)?.value ?? '',
      slug: (form.elements.namedItem('slug') as HTMLInputElement)?.value ?? '',
      bio: (form.elements.namedItem('bio') as HTMLTextAreaElement)?.value ?? '',
      avatarUrl: (form.elements.namedItem('avatarUrl') as HTMLInputElement)?.value ?? '',
      coverImageUrl: (form.elements.namedItem('coverImageUrl') as HTMLInputElement)?.value ?? '',
      accentColor: (form.elements.namedItem('accentColor') as HTMLInputElement)?.value ?? '',
      tags: this.splitTags((form.elements.namedItem('tags') as HTMLInputElement)?.value ?? ''),
      age: Number((form.elements.namedItem('age') as HTMLInputElement)?.value || 0) || undefined,
      gender: (form.elements.namedItem('gender') as HTMLInputElement)?.value ?? '',
      country: (form.elements.namedItem('country') as HTMLInputElement)?.value ?? '',
      city: (form.elements.namedItem('city') as HTMLInputElement)?.value ?? '',
      interestedIn: (form.elements.namedItem('interestedIn') as HTMLInputElement)?.value ?? '',
      relationshipStatus: (form.elements.namedItem('relationshipStatus') as HTMLInputElement)?.value ?? '',
      bodyType: (form.elements.namedItem('bodyType') as HTMLInputElement)?.value ?? '',
      languages: this.splitTags((form.elements.namedItem('languages') as HTMLInputElement)?.value ?? ''),
      categories: this.splitTags((form.elements.namedItem('categories') as HTMLInputElement)?.value ?? ''),
      subcategories: this.splitTags((form.elements.namedItem('subcategories') as HTMLInputElement)?.value ?? ''),
      instagramUrl: (form.elements.namedItem('instagramUrl') as HTMLInputElement)?.value ?? '',
      xUrl: (form.elements.namedItem('xUrl') as HTMLInputElement)?.value ?? '',
      onlyFansUrl: (form.elements.namedItem('onlyFansUrl') as HTMLInputElement)?.value ?? '',
      websiteUrl: (form.elements.namedItem('websiteUrl') as HTMLInputElement)?.value ?? '',
    });
  }

  private splitTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
