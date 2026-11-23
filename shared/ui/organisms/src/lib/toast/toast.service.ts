import { Injectable, signal } from '@angular/core';

export type UiToastTone = 'neutral' | 'success' | 'danger';

export interface UiToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface UiToastOptions {
  readonly message: string;
  readonly tone?: UiToastTone;
  readonly action?: UiToastAction;
  readonly duration?: number;
}

export interface UiToastItem {
  readonly id: number;
  readonly message: string;
  readonly tone: UiToastTone;
  readonly action: UiToastAction | null;
  readonly duration: number;
}

export interface UiToastHandle {
  dismiss(): void;
}

const DEFAULT_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class UiToast {
  private readonly items = signal<readonly UiToastItem[]>([]);
  private nextId = 0;

  readonly toasts = this.items.asReadonly();

  show(options: UiToastOptions): UiToastHandle {
    const item: UiToastItem = {
      id: this.nextId++,
      message: options.message,
      tone: options.tone ?? 'neutral',
      action: options.action ?? null,
      duration: options.duration ?? DEFAULT_DURATION_MS,
    };
    this.items.update((items) => [...items, item]);
    return { dismiss: () => this.dismiss(item.id) };
  }

  dismiss(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }
}
