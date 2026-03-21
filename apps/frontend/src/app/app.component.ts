import { Component, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" routerLink="/">
          <span class="brand-mark" [class.brand-mark-grid]="activeModule() === 'grid'" [class.brand-mark-room]="activeModule() === 'room'" [class.brand-mark-system]="activeModule() === 'system'">
            <span class="brand-module"></span>
          </span>

          <span class="brand-copy">
            <strong>Naughtybox</strong>
            <small>Live bold. Own the room.</small>
          </span>
        </a>

        <nav class="topnav">
          <a routerLink="/">Salas</a>
          <a href="/api/health" target="_blank" rel="noreferrer">API</a>
        </nav>
      </header>

      <router-outlet />

      <footer class="site-footer">
        <div>
          <strong>Naughtybox</strong>
          <p>
            Copyright © 2026 Naughtybox. All rights reserved. Branding, interface,
            software, layout systems and platform assets are protected intellectual property.
          </p>
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
  private readonly subscription = this.router.events.subscribe((event) => {
    if (event instanceof NavigationEnd) {
      this.activeModule.set(this.resolveModule(event.urlAfterRedirects));
    }
  });

  readonly activeModule = signal<'grid' | 'room' | 'system'>(this.resolveModule(this.router.url));

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private resolveModule(url: string): 'grid' | 'room' | 'system' {
    if (url.startsWith('/streams/')) {
      return 'room';
    }

    if (url.startsWith('/api')) {
      return 'system';
    }

    return 'grid';
  }
}
