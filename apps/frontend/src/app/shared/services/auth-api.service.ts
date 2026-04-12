import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@naughtybox/shared-types';

const STORAGE_KEY = 'naughtybox.auth';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly baseUrl = '/api';
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly userSignal = signal<User | null>(this.readStoredUser());

  readonly token = computed(() => this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => Boolean(this.tokenSignal()));

  async register(payload: RegisterRequest) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('No se pudo crear la cuenta.');
    }

    const session = (await response.json()) as AuthResponse;
    this.persist(session);
    return session;
  }

  async login(payload: LoginRequest) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Credenciales no validas.');
    }

    const session = (await response.json()) as AuthResponse;
    this.persist(session);
    return session;
  }

  async me() {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Sesion no valida.');
    }

    const user = (await response.json()) as User;
    this.userSignal.set(user);
    this.persistCurrent();
    return user;
  }

  logout() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  authHeaders() {
    const token = this.tokenSignal();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private persist(session: AuthResponse) {
    this.tokenSignal.set(session.token);
    this.userSignal.set(session.user);
    this.persistCurrent();
  }

  private persistCurrent() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const token = this.tokenSignal();
    const user = this.userSignal();

    if (!token || !user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token,
        user,
      }),
    );
  }

  private readStoredToken() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored).token as string) : null;
    } catch {
      return null;
    }
  }

  private readStoredUser() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored).user as User) : null;
    } catch {
      return null;
    }
  }
}
