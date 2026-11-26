import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

export interface GoogleCredentialResponse {
  readonly credential: string;
}

export interface GoogleButtonOptions {
  readonly type: 'standard';
  readonly theme: 'outline';
  readonly size: 'large';
  readonly text: 'continue_with';
  readonly shape: 'pill';
  readonly locale: string;
  readonly width: number;
}

export interface GoogleAccountsId {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

interface GoogleWindow extends Window {
  google?: { accounts?: { id?: GoogleAccountsId } };
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityLoader {
  private readonly document = inject(DOCUMENT);
  private loading: Promise<GoogleAccountsId> | null = null;

  load(): Promise<GoogleAccountsId> {
    this.loading ??= this.inject();
    return this.loading;
  }

  private inject(): Promise<GoogleAccountsId> {
    return new Promise<GoogleAccountsId>((resolve, reject) => {
      const script = this.document.createElement('script');
      const fail = () => {
        script.remove();
        this.loading = null;
        reject(new Error('Google Identity Services could not be loaded'));
      };
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.onload = () => {
        const accountsId = (this.document.defaultView as GoogleWindow | null)?.google?.accounts?.id;
        if (accountsId) resolve(accountsId);
        else fail();
      };
      script.onerror = fail;
      this.document.head.appendChild(script);
    });
  }
}
