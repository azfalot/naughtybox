import { Injectable, inject } from '@angular/core';
import {
  AdminCreatorWallet,
  AdminOverview,
  CreatorVerificationSubmission,
  ModerationAction,
  PayoutEntry,
  ReviewPayoutRequest,
  Report,
  ReviewCreatorVerificationRequest,
} from '@naughtybox/shared-types';
import { AuthApiService } from '../shared/services/auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly baseUrl = '/api';
  private readonly authApi = inject(AuthApiService);

  async getOverview() {
    const response = await fetch(`${this.baseUrl}/admin/overview`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudo cargar el overview admin.');
    }
    return (await response.json()) as AdminOverview;
  }

  async listReports() {
    const response = await fetch(`${this.baseUrl}/trust-safety/reports`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudieron cargar los reportes.');
    }
    return (await response.json()) as Report[];
  }

  async listActions() {
    const response = await fetch(`${this.baseUrl}/trust-safety/actions`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudieron cargar las acciones.');
    }
    return (await response.json()) as ModerationAction[];
  }

  async listCreators() {
    const response = await fetch(`${this.baseUrl}/admin/creators`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudieron cargar creadoras y wallets.');
    }
    return (await response.json()) as AdminCreatorWallet[];
  }

  async listCreatorVerifications() {
    const response = await fetch(`${this.baseUrl}/admin/creator-verifications`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudieron cargar las verificaciones de creadoras.');
    }
    return (await response.json()) as Array<
      CreatorVerificationSubmission & { displayName: string; slug: string; username: string }
    >;
  }

  async listPayouts() {
    const response = await fetch(`${this.baseUrl}/admin/payouts`, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudo cargar la cola de payouts.');
    }
    return (await response.json()) as PayoutEntry[];
  }

  async reviewPayout(payoutEntryId: string, payload: ReviewPayoutRequest) {
    const response = await fetch(`${this.baseUrl}/admin/payouts/${payoutEntryId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authApi.authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('No se pudo revisar el payout.');
    }
    return (await response.json()) as PayoutEntry;
  }

  async reviewCreatorVerification(creatorProfileId: string, payload: ReviewCreatorVerificationRequest) {
    const response = await fetch(`${this.baseUrl}/admin/creator-verifications/${creatorProfileId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authApi.authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('No se pudo revisar la verificacion.');
    }
    return (await response.json()) as CreatorVerificationSubmission;
  }
}
