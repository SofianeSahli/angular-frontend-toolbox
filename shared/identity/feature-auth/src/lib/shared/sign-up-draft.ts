import { Injectable, signal } from '@angular/core';

export interface SignUpDraftValues {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly terms: boolean;
}

@Injectable({ providedIn: 'root' })
export class SignUpDraft {
  readonly values = signal<SignUpDraftValues | null>(null);
}
