import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CreatorPublicProfile } from '@naughtybox/shared-types';

type MediaPreview = {
  title: string;
  type: 'free' | 'premium' | 'store';
  price?: string;
};

const FOLLOWERS_BASE = 1800;
const FOLLOWERS_PER_CATEGORY = 240;
const VIEWS_BASE = 12000;
const VIEWS_PER_SUBCATEGORY = 750;
const RANKING_BASE = 120;
const RANKING_PER_LANGUAGE = 12;

@Component({
  selector: 'app-creator-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel-card profile-hero" [style.background]="coverStyle">
      <div class="profile-hero-copy profile-hero-copy-tight">
        <p class="eyebrow">Perfil</p>
        <h2>{{ profile.displayName }}</h2>
        <p class="muted profile-hero-bio">{{ profile.bio }}</p>
        <div class="social-links-grid social-links-grid-tight" *ngIf="hasSocialLinks">
          <a *ngIf="profile.instagramUrl" class="social-link-card social-link-card-mini" [href]="profile.instagramUrl" target="_blank" rel="noreferrer"><span class="social-icon">IG</span><span>Instagram</span></a>
          <a *ngIf="profile.xUrl" class="social-link-card social-link-card-mini" [href]="profile.xUrl" target="_blank" rel="noreferrer"><span class="social-icon">X</span><span>X</span></a>
          <a *ngIf="profile.onlyFansUrl" class="social-link-card social-link-card-mini" [href]="profile.onlyFansUrl" target="_blank" rel="noreferrer"><span class="social-icon">OF</span><span>OnlyFans</span></a>
          <a *ngIf="profile.websiteUrl" class="social-link-card social-link-card-mini" [href]="profile.websiteUrl" target="_blank" rel="noreferrer"><span class="social-icon">WEB</span><span>Web</span></a>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat-box">
          <strong>{{ followersCount }}</strong>
          <span>Followers</span>
        </div>
        <div class="profile-stat-box">
          <strong>{{ profileViewsCount }}</strong>
          <span>Visibilidad</span>
        </div>
        <div class="profile-stat-box">
          <strong>#{{ rankingScore }}</strong>
          <span>Ranking</span>
        </div>
      </div>
    </section>

    <section class="panel-card profile-section">
      <div class="profile-section-grid">
        <div>
          <h3 class="mini-title">Acerca de {{ profile.displayName }}</h3>
          <p class="muted room-bio">{{ profile.bio }}</p>
        </div>
        <div class="profile-facts">
          <div><span class="muted">Edad</span><strong>{{ profile.age || '-' }}</strong></div>
          <div><span class="muted">Genero</span><strong>{{ profile.gender || '-' }}</strong></div>
          <div><span class="muted">Ciudad</span><strong>{{ profile.city || '-' }}</strong></div>
          <div><span class="muted">Relacion</span><strong>{{ profile.relationshipStatus || '-' }}</strong></div>
          <div><span class="muted">Body type</span><strong>{{ profile.bodyType || '-' }}</strong></div>
          <div><span class="muted">Idiomas</span><strong>{{ profile.languages.join(' · ') || '-' }}</strong></div>
        </div>
      </div>
    </section>

    <section class="panel-card profile-section" *ngIf="hasSocialLinks">
      <div class="profile-section-header">
        <h3 class="mini-title">Redes y enlaces</h3>
      </div>
      <div class="social-links-grid">
        <a *ngIf="profile.instagramUrl" class="social-link-card" [href]="profile.instagramUrl" target="_blank" rel="noreferrer"><span class="social-icon">IG</span><span>Instagram</span></a>
        <a *ngIf="profile.xUrl" class="social-link-card" [href]="profile.xUrl" target="_blank" rel="noreferrer"><span class="social-icon">X</span><span>X</span></a>
        <a *ngIf="profile.onlyFansUrl" class="social-link-card" [href]="profile.onlyFansUrl" target="_blank" rel="noreferrer"><span class="social-icon">OF</span><span>OnlyFans</span></a>
        <a *ngIf="profile.websiteUrl" class="social-link-card" [href]="profile.websiteUrl" target="_blank" rel="noreferrer"><span class="social-icon">WEB</span><span>Website</span></a>
      </div>
    </section>

    <section class="panel-card profile-section">
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

    <section class="panel-card profile-section">
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
  `,
})
export class CreatorProfileComponent {
  @Input({ required: true }) profile!: CreatorPublicProfile;

  // Placeholder preview data – replace with profile-specific content once the media API is available.
  readonly storePreview: MediaPreview[] = [
    { title: 'Wishlist premium', type: 'store', price: '12 tokens' },
    { title: 'Private pack', type: 'store', price: '45 tokens' },
    { title: 'Gift request', type: 'store', price: '25 tokens' },
  ];

  readonly videoPreview: MediaPreview[] = [
    { title: 'Teaser diario', type: 'free' },
    { title: 'Afterhours cut', type: 'premium', price: '18 tokens' },
    { title: 'VIP backstage', type: 'premium', price: '32 tokens' },
    { title: 'Free intro clip', type: 'free' },
  ];

  get coverStyle(): string {
    return (
      this.profile?.coverImageUrl ??
      'linear-gradient(135deg, rgba(21,159,149,0.32), rgba(255,138,61,0.22), rgba(7,18,20,0.94))'
    );
  }

  get followersCount(): number {
    return FOLLOWERS_BASE + (this.profile?.categories.length ?? 0) * FOLLOWERS_PER_CATEGORY;
  }

  get profileViewsCount(): number {
    return VIEWS_BASE + (this.profile?.subcategories.length ?? 0) * VIEWS_PER_SUBCATEGORY;
  }

  get rankingScore(): number {
    return RANKING_BASE + (this.profile?.languages.length ?? 0) * RANKING_PER_LANGUAGE;
  }

  get hasSocialLinks(): boolean {
    return Boolean(
      this.profile?.instagramUrl ||
        this.profile?.xUrl ||
        this.profile?.onlyFansUrl ||
        this.profile?.websiteUrl,
    );
  }
}
