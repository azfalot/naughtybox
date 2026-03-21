import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page auth-page">
      <section class="auth-shell panel-card">
        <div>
          <p class="eyebrow">Registro</p>
          <h1 class="lobby-title">Crea tu cuenta</h1>
          <p class="muted">Empezamos por viewer segura y luego subimos a creadora desde el estudio.</p>
        </div>

        <form class="auth-form" (submit)="register($event)">
          <label>
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" />
          </label>
          <label>
            <span>Usuario</span>
            <input name="username" type="text" autocomplete="username" />
          </label>
          <label>
            <span>Contrasena</span>
            <input name="password" type="password" autocomplete="new-password" />
          </label>
          <p *ngIf="error()" class="form-error">{{ error() }}</p>
          <button type="submit">Crear cuenta</button>
        </form>

        <p class="muted auth-switch">
          Ya tienes cuenta?
          <a routerLink="/login">Entrar</a>
        </p>
      </section>
    </main>
  `,
})
export class RegisterPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly error = signal('');

  async register(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value ?? '';
    const username = (form.elements.namedItem('username') as HTMLInputElement)?.value ?? '';
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '';

    try {
      await this.authApi.register({ email, username, password });
      this.error.set('');
      await this.router.navigateByUrl('/studio');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    }
  }
}
