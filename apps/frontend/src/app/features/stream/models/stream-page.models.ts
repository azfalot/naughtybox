import { CreatorPublicProfile } from '@naughtybox/shared-types';

export type MediaPreview = {
  title: string;
  type: 'free' | 'premium' | 'store';
  price?: string;
};

export type StreamProfileTab = 'bio' | 'links' | 'store' | 'videos';

export const DEFAULT_PROFILE: CreatorPublicProfile = {
  displayName: 'Creator',
  slug: 'creator',
  bio: 'Perfil publico pensado para combinar directo, biografia, tienda y contenido bajo demanda.',
  languages: [],
  categories: [],
  subcategories: [],
};

export const STORE_PREVIEW: MediaPreview[] = [
  { title: 'Wishlist premium', type: 'store', price: '12 NC' },
  { title: 'Private pack', type: 'store', price: '45 NC' },
  { title: 'Gift request', type: 'store', price: '25 NC' },
];

export const VIDEO_PREVIEW: MediaPreview[] = [
  { title: 'Teaser diario', type: 'free' },
  { title: 'Afterhours cut', type: 'premium', price: '18 NC' },
  { title: 'VIP backstage', type: 'premium', price: '32 NC' },
  { title: 'Free intro clip', type: 'free' },
];
