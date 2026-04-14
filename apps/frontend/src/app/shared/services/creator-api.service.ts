import { Injectable } from '@angular/core';
import {
  BillingConfig,
  CreatorDashboard,
  UpsertCreatorProfileRequest,
  UpsertCreatorRoomRequest,
} from '@naughtybox/shared-types';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class CreatorApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly authApi: AuthApiService) {}

  async getDashboard() {
    const response = await fetch(`${this.baseUrl}/creator/dashboard`, {
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar el panel de creadora.');
    }

    return (await response.json()) as CreatorDashboard;
  }

  async saveProfile(payload: UpsertCreatorProfileRequest) {
    const response = await fetch(`${this.baseUrl}/creator/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('No se pudo guardar el perfil.');
    }

    return response.json();
  }

  async saveRoom(payload: UpsertCreatorRoomRequest) {
    const response = await fetch(`${this.baseUrl}/creator/room`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('No se pudo guardar la sala.');
    }

    return response.json();
  }

  async getBillingConfig() {
    const response = await fetch(`${this.baseUrl}/streams/meta/billing`);
    if (!response.ok) {
      throw new Error('No se pudo cargar la configuracion de billing.');
    }
    return (await response.json()) as BillingConfig;
  }

  async startBroadcast() {
    const response = await fetch(`${this.baseUrl}/creator/broadcast/start`, {
      method: 'POST',
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      throw new Error('No se pudo iniciar la sesion de broadcast.');
    }

    return response.json();
  }

  async stopBroadcast() {
    const response = await fetch(`${this.baseUrl}/creator/broadcast/stop`, {
      method: 'POST',
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      throw new Error('No se pudo detener la sesion de broadcast.');
    }

    return response.json();
  }

  private authHeaders() {
    return this.authApi.authHeaders();
  }
}
