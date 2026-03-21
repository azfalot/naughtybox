import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { CreatorStudioPageComponent } from './pages/creator-studio-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { StreamPageComponent } from './pages/stream-page.component';

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
];
