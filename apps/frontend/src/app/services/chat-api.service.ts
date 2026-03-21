import { Injectable } from '@angular/core';
import { ChatMessage } from '@naughtybox/shared-types';
import { io, Socket } from 'socket.io-client';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private socket?: Socket;

  constructor(private readonly authApi: AuthApiService) {}

  async getHistory(roomSlug: string) {
    const response = await fetch(`/api/chat/${roomSlug}`);
    if (!response.ok) {
      throw new Error('No se pudo cargar el historial del chat.');
    }

    return (await response.json()) as ChatMessage[];
  }

  connect(
    roomSlug: string,
    handlers: {
      onHistory: (messages: ChatMessage[]) => void;
      onMessage: (message: ChatMessage) => void;
    },
  ) {
    const token = this.authApi.token();
    if (!token) {
      return null;
    }

    this.disconnect();

    this.socket = io('/', {
      path: '/socket.io',
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('chat:history', handlers.onHistory);
    this.socket.on('chat:message', handlers.onMessage);
    this.socket.on('connect', () => {
      this.socket?.emit('chat:join', roomSlug);
    });

    return this.socket;
  }

  sendMessage(roomSlug: string, body: string) {
    this.socket?.emit('chat:message', {
      roomSlug,
      body,
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
