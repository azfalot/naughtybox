import { Injectable, inject } from '@angular/core';
import { StreamDetails } from '@naughtybox/shared-types';
import { AuthApiService } from '../shared/services/auth-api.service';
import { readApiError } from './api-error';

type Goal = NonNullable<StreamDetails['goals']>[number];
type GoalContribution = {
  id: string;
  goalId: string;
  sessionId?: string;
  userId: string;
  username: string;
  amount: number;
  createdAt: string;
};
type TicketedEvent = NonNullable<StreamDetails['activeEvent']>;
type PrivateShowRequest = NonNullable<StreamDetails['privateShowRequest']> & {
  id: string;
  roomSlug: string;
  sessionId?: string;
  requesterUserId?: string;
  createdAt?: string;
  updatedAt?: string;
};
type ReportReason =
  | 'creator_misconduct'
  | 'harassment'
  | 'fraud'
  | 'copyright'
  | 'dangerous_behavior'
  | 'non_consensual_content'
  | 'underage_risk'
  | 'other';
type CreateGoalPayload = {
  title: string;
  description?: string;
  actionLabel: string;
  targetTokens: number;
  durationMinutes?: number;
  unlocksEvent?: boolean;
};
type CreatePrivateShowPayload = {
  tokensPerMinute: number;
};
type CreateReportPayload = {
  targetType: 'room' | 'user_account' | 'creator_profile' | 'stream';
  targetId: string;
  roomSlug?: string;
  sessionId?: string;
  reason: ReportReason;
  details: string;
};
type CreatorMuteViewerPayload = {
  roomSlug: string;
  targetUsername: string;
  reason: string;
  durationHours?: number;
};
type CreatorReportViewerPayload = {
  roomSlug: string;
  targetUsername: string;
  reason: ReportReason;
  details: string;
};
type CreatorRoomModerationResult = {
  roomSlug: string;
  targetUserId: string;
  targetUsername: string;
  action: 'muted' | 'reported';
  expiresAt?: string;
};
type CreateTicketedEventPayload = {
  title: string;
  description?: string;
  ticketPrice: number;
  startsAt?: string;
  allowMemberAccess?: boolean;
  goalId?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ShowsApiService {
  private readonly baseUrl = '/api';
  private readonly authApi = inject(AuthApiService);

  async listGoals(roomSlug: string) {
    return this.get<Goal[]>(`${this.baseUrl}/shows/${roomSlug}/goals`);
  }

  async listContributions(roomSlug: string) {
    return this.get<GoalContribution[]>(`${this.baseUrl}/shows/${roomSlug}/contributions`);
  }

  async getActiveEvent(roomSlug: string) {
    return this.get<TicketedEvent | null>(`${this.baseUrl}/shows/${roomSlug}/event`);
  }

  async createGoal(roomSlug: string, payload: CreateGoalPayload) {
    return this.post<Goal>(`${this.baseUrl}/shows/${roomSlug}/goals`, payload);
  }

  async contributeToGoal(roomSlug: string, amount: number) {
    return this.post<Goal>(`${this.baseUrl}/shows/${roomSlug}/goals/contribute`, { amount });
  }

  async createEvent(roomSlug: string, payload: CreateTicketedEventPayload) {
    return this.post<TicketedEvent>(`${this.baseUrl}/shows/${roomSlug}/events`, payload);
  }

  async startEvent(eventId: string) {
    return this.post<TicketedEvent>(`${this.baseUrl}/shows/events/${eventId}/start`, {});
  }

  async endEvent(eventId: string) {
    return this.post<TicketedEvent>(`${this.baseUrl}/shows/events/${eventId}/end`, {});
  }

  async buyTicket(eventId: string) {
    return this.post(`${this.baseUrl}/shows/events/${eventId}/buy`, {});
  }

  async requestPrivateShow(roomSlug: string, payload: CreatePrivateShowPayload) {
    return this.post<PrivateShowRequest>(`${this.baseUrl}/shows/${roomSlug}/private-request`, payload);
  }

  async acceptPrivateRequest(requestId: string) {
    return this.post<PrivateShowRequest>(`${this.baseUrl}/shows/private-requests/${requestId}/accept`, {});
  }

  async rejectPrivateRequest(requestId: string) {
    return this.post<PrivateShowRequest>(`${this.baseUrl}/shows/private-requests/${requestId}/reject`, {});
  }

  async submitReport(payload: CreateReportPayload) {
    return this.post(`${this.baseUrl}/trust-safety/reports`, payload);
  }

  async creatorMuteViewer(payload: CreatorMuteViewerPayload) {
    return this.post<CreatorRoomModerationResult>(`${this.baseUrl}/trust-safety/creator-actions/mute`, payload);
  }

  async creatorReportViewer(payload: CreatorReportViewerPayload) {
    return this.post<CreatorRoomModerationResult>(
      `${this.baseUrl}/trust-safety/creator-actions/report-viewer`,
      payload,
    );
  }

  private async get<T>(url: string) {
    const response = await fetch(url, {
      headers: this.authApi.authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response, 'No se pudo cargar la informacion de shows.'));
    }
    return (await response.json()) as T;
  }

  private async post<T>(url: string, payload: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authApi.authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response, 'No se pudo completar la accion.'));
    }
    return (await response.json()) as T;
  }
}
