import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorPublicProfile, StreamDetails } from '@naughtybox/shared-types';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';
import { SectionTabOption, SectionTabsComponent } from '../../../ui/navigation/section-tabs.component';
import { MediaPreview, StreamProfileTab } from '../models/stream-page.models';

const PROFILE_TABS: SectionTabOption<StreamProfileTab>[] = [
  { id: 'bio', label: 'Bio' },
  { id: 'links', label: 'Links' },
  { id: 'store', label: 'Store' },
  { id: 'videos', label: 'Videos' },
];

@Component({
  selector: 'app-stream-profile-panel',
  standalone: true,
  imports: [CommonModule, SectionTabsComponent, AppIconComponent],
  template: `
    <section class="panel-card profile-hero" *ngIf="stream && profile" [style.background]="coverStyle">
      <div class="profile-hero-copy profile-hero-copy-tight">
        <p class="eyebrow">Perfil</p>
        <div class="profile-heading-inline">
          <div class="avatar-chip avatar-chip-large" [style.background-image]="avatarStyle">
            <span *ngIf="!profile.avatarUrl">{{ initials(profile.displayName) }}</span>
          </div>
          <div>
            <h2>{{ profile.displayName }}</h2>
            <p class="muted room-kicker">{{ stream.creatorName }} · {{ profile.country || 'Origen pendiente' }}</p>
          </div>
        </div>
        <p class="muted profile-hero-bio">{{ profile.bio }}</p>
        <div class="social-links-grid social-links-grid-tight" *ngIf="hasSocialLinks">
          <a
            *ngIf="profile.instagramUrl"
            class="social-link-card social-link-card-mini"
            [href]="profile.instagramUrl"
            target="_blank"
            rel="noreferrer"
            ><span class="social-icon"><app-icon name="instagram" [size]="14"></app-icon></span
            ><span>Instagram</span></a
          >
          <a
            *ngIf="profile.xUrl"
            class="social-link-card social-link-card-mini"
            [href]="profile.xUrl"
            target="_blank"
            rel="noreferrer"
            ><span class="social-icon"><app-icon name="x-social" [size]="14"></app-icon></span><span>X</span></a
          >
          <a
            *ngIf="profile.onlyFansUrl"
            class="social-link-card social-link-card-mini"
            [href]="profile.onlyFansUrl"
            target="_blank"
            rel="noreferrer"
            ><span class="social-icon"><app-icon name="onlyfans" [size]="14"></app-icon></span><span>OnlyFans</span></a
          >
          <a
            *ngIf="profile.websiteUrl"
            class="social-link-card social-link-card-mini"
            [href]="profile.websiteUrl"
            target="_blank"
            rel="noreferrer"
            ><span class="social-icon"><app-icon name="globe" [size]="14"></app-icon></span><span>Web</span></a
          >
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat-box">
          <strong>{{ followersCount }}</strong
          ><span>Followers</span>
        </div>
        <div class="profile-stat-box">
          <strong>{{ profileViewsCount }}</strong
          ><span>Visibilidad</span>
        </div>
        <div class="profile-stat-box">
          <strong>#{{ rankingScore }}</strong
          ><span>Ranking</span>
        </div>
      </div>
    </section>

    <section class="panel-card profile-section">
      <app-section-tabs
        [tabs]="tabs"
        [activeId]="activeTab"
        [inline]="true"
        (activeIdChange)="activeTabChange.emit($event)"
      ></app-section-tabs>
    </section>

    <section class="panel-card profile-section" *ngIf="profile && activeTab === 'bio'">
      <div class="profile-section-grid">
        <div>
          <h3 class="mini-title">Acerca de {{ profile.displayName }}</h3>
          <p class="muted room-bio">{{ profile.bio }}</p>
        </div>
        <div class="profile-facts">
          <div>
            <span class="muted">Edad</span><strong>{{ profile.age || '-' }}</strong>
          </div>
          <div>
            <span class="muted">Género</span><strong>{{ genderLabel(profile.gender) }}</strong>
          </div>
          <div>
            <span class="muted">Ciudad</span><strong>{{ profile.city || '-' }}</strong>
          </div>
          <div>
            <span class="muted">Relacion</span><strong>{{ profile.relationshipStatus || '-' }}</strong>
          </div>
          <div>
            <span class="muted">Tipo de cuerpo</span><strong>{{ profile.bodyType || '-' }}</strong>
          </div>
          <div>
            <span class="muted">Idiomas</span><strong>{{ profile.languages.join(' · ') || '-' }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="activeTab === 'store'">
      <div class="profile-section-header">
        <h3 class="mini-title">Tienda destacada</h3>
        <a class="text-link" href="#">Ver tienda</a>
      </div>
      <div class="media-strip">
        <article class="media-card" *ngFor="let item of storePreview">
          <div class="media-card-thumb media-card-store">{{ item.type === 'store' ? 'SHOP' : 'MEDIA' }}</div>
          <strong>{{ item.title }}</strong>
          <span>{{ item.price || 'Disponible' }}</span>
        </article>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="activeTab === 'videos'">
      <div class="profile-section-header">
        <h3 class="mini-title">Videos</h3>
        <a class="text-link" href="#">Ver todo</a>
      </div>
      <div class="media-strip">
        <article class="media-card" *ngFor="let item of videoPreview">
          <div class="media-card-thumb" [class.media-card-premium]="item.type === 'premium'">
            {{ item.type === 'premium' ? 'VIP' : 'FREE' }}
          </div>
          <strong>{{ item.title }}</strong>
          <span>{{ item.price || 'Gratis' }}</span>
        </article>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="profile && activeTab === 'links'">
      <div class="profile-section-header"><h3 class="mini-title">Redes y enlaces</h3></div>
      <div class="social-links-grid" *ngIf="hasSocialLinks; else noLinks">
        <a
          *ngIf="profile.instagramUrl"
          class="social-link-card"
          [href]="profile.instagramUrl"
          target="_blank"
          rel="noreferrer"
          ><span class="social-icon"><app-icon name="instagram" [size]="15"></app-icon></span><span>Instagram</span></a
        >
        <a *ngIf="profile.xUrl" class="social-link-card" [href]="profile.xUrl" target="_blank" rel="noreferrer"
          ><span class="social-icon"><app-icon name="x-social" [size]="15"></app-icon></span><span>X</span></a
        >
        <a
          *ngIf="profile.onlyFansUrl"
          class="social-link-card"
          [href]="profile.onlyFansUrl"
          target="_blank"
          rel="noreferrer"
          ><span class="social-icon"><app-icon name="onlyfans" [size]="15"></app-icon></span><span>OnlyFans</span></a
        >
        <a
          *ngIf="profile.websiteUrl"
          class="social-link-card"
          [href]="profile.websiteUrl"
          target="_blank"
          rel="noreferrer"
          ><span class="social-icon"><app-icon name="globe" [size]="15"></app-icon></span><span>Website</span></a
        >
      </div>
      <ng-template #noLinks><p class="muted">Este creador aún no ha configurado enlaces externos.</p></ng-template>
    </section>
  `,
})
export class StreamProfilePanelComponent {
  readonly tabs = PROFILE_TABS;

  @Input() stream: StreamDetails | null = null;
  @Input() profile: CreatorPublicProfile | null = null;
  @Input() activeTab: StreamProfileTab = 'bio';
  @Input() followersCount = 0;
  @Input() profileViewsCount = 0;
  @Input() rankingScore = 0;
  @Input() coverStyle = '';
  @Input() avatarStyle = 'none';
  @Input() hasSocialLinks = false;
  @Input() storePreview: MediaPreview[] = [];
  @Input() videoPreview: MediaPreview[] = [];
  @Output() readonly activeTabChange = new EventEmitter<StreamProfileTab>();

  initials(value: string) {
    return value
      .split(' ')
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  genderLabel(value?: string) {
    if (!value) return '-';
    const normalized = value.toLowerCase();
    if (normalized === 'woman' || normalized === 'female') return 'Mujer';
    if (normalized === 'man' || normalized === 'male') return 'Hombre';
    if (normalized === 'couple') return 'Pareja';
    if (normalized === 'trans') return 'Trans';
    return value;
  }
}
