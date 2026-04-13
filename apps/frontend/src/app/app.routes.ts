import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home-page.component';
import { CreatorStudioPageComponent } from './features/creator-studio/creator-studio-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { StreamPageComponent } from './features/stream/pages/stream-page.component';
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
