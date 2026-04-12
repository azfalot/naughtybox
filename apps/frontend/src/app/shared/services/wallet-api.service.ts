import { Injectable } from '@angular/core';
import { WalletSummary } from '@naughtybox/shared-types';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class WalletApiService {
  private readonly baseUrl = '/api/wallet';

  constructor(private readonly authApi: AuthApiService) {}

  async getWallet() {
    const response = await fetch(this.baseUrl, {
      headers: this.authApi.authHeaders(),
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar la wallet.');
    }

    return (await response.json()) as WalletSummary;
  }

  async addDevCredit() {
    const response = await fetch(`${this.baseUrl}/dev-credit`, {
      method: 'POST',
      headers: this.authApi.authHeaders(),
    });

    if (!response.ok) {
      throw new Error('No se pudo recargar saldo de prueba.');
    }

    return (await response.json()) as WalletSummary;
  }

  async tipCreator(roomSlug: string, amount: number, note?: string) {
    const response = await fetch(`${this.baseUrl}/tip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authApi.authHeaders(),
      },
      body: JSON.stringify({
        roomSlug,
        amount,
        note,
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo enviar la propina.');
    }

    return (await response.json()) as WalletSummary;
  }
}
