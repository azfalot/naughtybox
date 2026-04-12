import { Routes } from '@angular/router';
import { HomePageComponent } from './features/catalog/home-page.component';
import { CreatorStudioPageComponent } from './features/studio/creator-studio-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { StreamPageComponent } from './features/stream/stream-page.component';
import { LegalPageComponent } from './features/legal/legal-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'streams/:slug',
    component: StreamPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'register',
    component: RegisterPageComponent,
  },
  {
    path: 'studio',
    component: CreatorStudioPageComponent,
  },
  {
    path: 'legal/:section',
    component: LegalPageComponent,
  },
];
