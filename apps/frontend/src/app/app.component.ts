import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthApiService } from './shared/services/auth-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <section *ngIf="!ageConfirmed()" class="age-gate-backdrop">
        <div class="panel-card age-gate-card">
          <p class="eyebrow">18+ only</p>
          <h2 class="mini-title" style="margin-bottom: 8px;">Acceso restringido a adultos</h2>
          <p class="muted">
            Naughtybox es una plataforma para mayores de edad. Al continuar declaras que tienes 18 anos o mas y aceptas revisar nuestras normas basicas.
          </p>
          <div class="age-gate-actions">
            <button type="button" class="text-link text-link-solid" (click)="confirmAge()">Soy mayor de edad</button>
            <a class="text-link" href="https://www.google.es" rel="noreferrer">Salir</a>
          </div>
          <div class="age-gate-links">
            <a routerLink="/legal/terms">Terminos</a>
            <a routerLink="/legal/privacy">Privacidad</a>
            <a routerLink="/legal/cookies">Cookies</a>
            <a routerLink="/legal/18plus">Seguridad 18+</a>
          </div>
        </div>
      </section>

      <header class="topbar">
        <a class="brand" routerLink="/">
          <span
            class="brand-mark"
            [class.brand-mark-grid]="activeModule() === 'grid'"
            [class.brand-mark-room]="activeModule() === 'room'"
            [class.brand-mark-system]="activeModule() === 'system'"
          >
            <span class="brand-module"></span>
          </span>

          <span class="brand-copy">
            <strong>Naughtybox</strong>
            <small>Live bold. Own the room.</small>
          </span>
        </a>

        <div class="topbar-actions">
          <div *ngIf="authApi.isAuthenticated() && authApi.user()" class="account-pill">
            <span class="account-name">{{ authApi.user()!.username }}</span>
            <span class="account-role">{{ accountLabel() }}</span>
          </div>

          <nav class="topnav">
            <a routerLink="/" [queryParams]="{ section: 'home' }">Salas</a>
            <a routerLink="/studio">Studio</a>
            <a *ngIf="!authApi.isAuthenticated()" routerLink="/login">Entrar</a>
            <a *ngIf="!authApi.isAuthenticated()" routerLink="/register">Registro</a>
            <a *ngIf="authApi.isAuthenticated()" href="#" (click)="logout($event)">Salir</a>
          </nav>
        </div>
      </header>

      <nav class="section-tabs">
        <a class="section-tab" routerLink="/" [queryParams]="{ section: 'home' }">Home</a>
        <a class="section-tab" routerLink="/" [queryParams]="{ section: 'discover' }">Discover</a>
        <a class="section-tab" routerLink="/" [queryParams]="{ section: 'tags' }">Tags</a>
        <a class="section-tab" routerLink="/" [queryParams]="{ section: 'private' }">Private Shows</a>
        <a class="section-tab" routerLink="/" [queryParams]="{ section: 'following' }">Following</a>
      </nav>

      <router-outlet />

      <footer class="site-footer">
        <div>
          <strong>Naughtybox</strong>
          <p>
            Copyright (c) 2026 Naughtybox. All rights reserved. Branding, interface,
            software, layout systems and platform assets are protected intellectual property.
          </p>
          <div class="footer-links">
            <a routerLink="/legal/terms">Terminos</a>
            <a routerLink="/legal/privacy">Privacidad</a>
            <a routerLink="/legal/cookies">Cookies</a>
            <a routerLink="/legal/18plus">18+</a>
            <a routerLink="/legal/creators">Creator guide</a>
          </div>
        </div>
        <p class="muted">
          Demo environment for product validation. Third-party content is not embedded or redistributed.
        </p>
      </footer>
    </div>
  `,
  styles: [],
})
export class AppComponent implements OnDestroy {
  private readonly router = inject(Router);
  readonly authApi = inject(AuthApiService);
  private readonly subscription = this.router.events.subscribe((event) => {
    if (event instanceof NavigationEnd) {
      this.activeModule.set(this.resolveModule(event.urlAfterRedirects));
    }
  });

  readonly activeModule = signal<'grid' | 'room' | 'system'>(this.resolveModule(this.router.url));
  readonly ageConfirmed = signal(this.readAgeGate());
  readonly accountLabel = computed(() => {
    const role = this.authApi.user()?.role;
    if (role === 'creator') {
      return 'Creator';
    }
    if (role === 'admin') {
      return 'Admin';
    }
    return 'Member';
  });

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async logout(event: Event) {
    event.preventDefault();
    this.authApi.logout();
    await this.router.navigateByUrl('/');
  }

  confirmAge() {
    this.ageConfirmed.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('naughtybox.age-confirmed', 'true');
    }
  }

  private resolveModule(url: string): 'grid' | 'room' | 'system' {
    if (url.startsWith('/streams/')) {
      return 'room';
    }

    if (url.startsWith('/studio')) {
      return 'system';
    }

    return 'grid';
  }

  private readAgeGate() {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return localStorage.getItem('naughtybox.age-confirmed') === 'true';
  }
}
