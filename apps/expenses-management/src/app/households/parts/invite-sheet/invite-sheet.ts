import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, computed, inject, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton } from '@shared/ui-atoms';
import { UiAlert } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiDialogBody, UiDialogHeader, UiToast } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { HouseholdStore } from '../../data/household.store';
import { QrInvitationsApi } from '../../data/qr-invitations-api';
import { toApiError } from '../../data/store-result';
import { retryText } from '../../support/retry-text';
import { fieldMessage, householdsMessage } from '../../support/server-errors';
import { InviteForm } from '../invite-form/invite-form';
import { QrCode } from '../qr-code/qr-code';

export type InviteTab = 'email' | 'qr';
export type InviteSheetResult = 'gone' | undefined;

export const JOIN_PATH = '/rejoindre';

interface ShownCode {
  readonly link: string;
  readonly expiresAt: number;
}

const SECOND = 1000;
const TABS: readonly InviteTab[] = ['email', 'qr'];

export function countdownText(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

@Component({
  selector: 'app-invite-sheet',
  imports: [InviteForm, QrCode, TranslatePipe, UiAlert, UiButton, UiDialogBody, UiDialogHeader],
  templateUrl: './invite-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteSheet {
  private readonly context = inject(UI_DIALOG_CONTEXT);
  private readonly household = inject(HouseholdStore);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly origin = inject(DOCUMENT).defaultView?.location.origin ?? '';
  private readonly inviteForm = viewChild(InviteForm);

  protected readonly tabs = TABS;
  protected readonly tab = signal<InviteTab>('email');
  protected readonly busy = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly code = signal<ShownCode | null>(null);
  protected readonly creating = signal(false);
  protected readonly qrError = signal<string | null>(null);
  private readonly now = signal(Date.now());
  protected readonly remaining = computed(() => {
    const code = this.code();
    return code === null ? 0 : Math.max(0, Math.ceil((code.expiresAt - this.now()) / SECOND));
  });
  protected readonly expired = computed(() => this.code() !== null && this.remaining() === 0);
  protected readonly countdown = computed(() => countdownText(this.remaining()));

  constructor() {
    const view = inject(DOCUMENT).defaultView;
    const timer = view?.setInterval(() => this.now.set(Date.now()), SECOND);
    inject(DestroyRef).onDestroy(() => {
      if (timer !== undefined) view?.clearInterval(timer);
      this.code.set(null);
    });
  }

  protected select(tab: InviteTab): void {
    this.tab.set(tab);
    if (tab === 'qr' && this.code() === null && !this.creating()) void this.newCode();
  }

  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: InviteTab = this.tab() === 'email' ? 'qr' : 'email';
    this.select(next);
    this.host.querySelector<HTMLElement>(`#invite-tab-${next}`)?.focus();
  }

  protected async invite(email: string): Promise<void> {
    this.inviteError.set(null);
    this.busy.set(true);
    const result = await this.household.invite(email);
    this.busy.set(false);
    if (result.outcome === 'done') {
      this.inviteForm()?.clear();
      this.toast.show({ message: this.translate.instant('households.household.invite.sent') });
      return;
    }
    if (result.error.code === 'household.not_found') {
      this.context.close('gone');
      return;
    }
    this.inviteError.set(this.inviteMessage(result.error));
  }

  protected async newCode(): Promise<void> {
    const household = this.household.household();
    if (household === null || this.creating()) return;
    this.creating.set(true);
    this.qrError.set(null);
    try {
      const created = await firstValueFrom(this.injector.get(QrInvitationsApi).create(household.id));
      this.code.set({ link: `${this.origin}${JOIN_PATH}#${created.token}`, expiresAt: created.expiresAt.getTime() });
      this.now.set(Date.now());
    } catch (caught) {
      const error = toApiError(caught);
      if (error.code === 'household.not_found') {
        this.context.close('gone');
        return;
      }
      this.qrError.set(this.qrMessage(error));
    } finally {
      this.creating.set(false);
    }
  }

  private inviteMessage(error: ApiError): string {
    if (error.code === 'request.throttled') {
      return this.translate.instant('households.household.invite.throttled', { retry: retryText(this.translate, error.retryAfterSeconds) });
    }
    return fieldMessage(this.translate, error, 'email') ?? householdsMessage(this.translate, error);
  }

  private qrMessage(error: ApiError): string {
    if (error.code === 'http.offline') return this.translate.instant('households.qr.offline');
    return householdsMessage(this.translate, error);
  }
}
