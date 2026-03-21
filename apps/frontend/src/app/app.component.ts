import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" routerLink="/">Naughtybox</a>
        <nav class="topnav">
          <a routerLink="/">Salas</a>
          <a href="/api/health" target="_blank" rel="noreferrer">API</a>
        </nav>
      </header>

      <router-outlet />
    </div>
  `,
  styles: [],
})
export class AppComponent {}
