import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../shared/services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page auth-page">
      <section class="auth-shell panel-card">
        <div>
          <p class="eyebrow">Acceso</p>
          <h1 class="lobby-title">Entra en Naughtybox</h1>
          <p class="muted">El chat, el estudio de creadora y la capa privada arrancan desde aqui.</p>
        </div>

        <form class="auth-form" (submit)="login($event)">
          <label>
            <span>Email o usuario</span>
            <input name="emailOrUsername" type="text" autocomplete="username" />
          </label>
          <label>
            <span>Contrasena</span>
            <input name="password" type="password" autocomplete="current-password" />
          </label>
          <p *ngIf="error()" class="form-error">{{ error() }}</p>
          <button type="submit">Entrar</button>
        </form>

        <p class="muted auth-switch">
          No tienes cuenta?
          <a routerLink="/register">Crear cuenta</a>
        </p>
      </section>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly error = signal('');

  async login(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailOrUsername = (form.elements.namedItem('emailOrUsername') as HTMLInputElement)?.value ?? '';
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '';

    try {
      await this.authApi.login({ emailOrUsername, password });
      this.error.set('');
      await this.router.navigateByUrl('/studio');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    }
  }
}
