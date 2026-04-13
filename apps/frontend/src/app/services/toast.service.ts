import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly items = signal<ToastItem[]>([]);

  show(message: string, tone: ToastTone = 'info') {
    const item: ToastItem = {
      id: crypto.randomUUID(),
      message,
      tone,
    };

    this.items.update((current) => [...current, item].slice(-4));
    setTimeout(() => this.dismiss(item.id), 3200);
  }

  dismiss(id: string) {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }
}
