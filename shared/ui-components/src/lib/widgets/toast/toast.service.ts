import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<{ message: string; type: string }[]>([]);

  show(
    message: string,
    type: 'info' | 'success' | 'danger' | 'warning' = 'info'
  ) {
    const newToast = { message, type };
    this.toasts.update((current) => [...current, newToast]);
    setTimeout(() => {
      this.toasts.update((current) => current.slice(1));
    }, 4000);
  }
}
