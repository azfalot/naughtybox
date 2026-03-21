import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
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
];
