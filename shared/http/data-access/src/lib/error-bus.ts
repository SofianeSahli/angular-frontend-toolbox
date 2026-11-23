import { Injectable, signal } from '@angular/core';
import { ApiError } from './api-error';

export interface PublishedError {
  readonly error: ApiError;
  readonly sequence: number;
}

@Injectable({ providedIn: 'root' })
export class ErrorBus {
  private readonly published = signal<PublishedError | null>(null);
  private sequence = 0;

  readonly latest = this.published.asReadonly();

  publish(error: ApiError): void {
    this.published.set({ error, sequence: ++this.sequence });
  }
}
