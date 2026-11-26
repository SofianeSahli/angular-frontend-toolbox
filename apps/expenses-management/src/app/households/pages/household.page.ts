import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiBadge, UiButton, UiIcon, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState, UiSectionHeader } from '@shared/ui-molecules';
import { UiConfirm, UiDialog, UiToast } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { UiPage } from '@shared/ui-templates';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { InvitationsStore } from '../data/invitations.store';
import { Invitation, Member } from '../data/models';
import { StoreResult } from '../data/store-result';
import { InviteSheet, InviteSheetResult } from '../parts/invite-sheet';
import { MembersList } from '../parts/members-list';
import { InvitationAnswer, ReceivedInvitationCard } from '../parts/received-invitation-card';
import { RenameForm } from '../parts/rename-form';
import { SentInvitations } from '../parts/sent-invitations';
import { fieldMessage, householdsMessage } from '../support/server-errors';

type Busy = 'rename' | 'delete' | 'leave' | 'remove' | 'cancel' | null;

@Component({
  selector: 'app-household-page',
  imports: [
    RouterLink,
    TranslatePipe,
    UiAlert,
    UiBadge,
    UiButton,
    UiEmptyState,
    UiIcon,
    UiPage,
    UiSectionHeader,
    UiSkeleton,
    MembersList,
    ReceivedInvitationCard,
    RenameForm,
    SentInvitations,
  ],
  templateUrl: './household.page.html',
  styleUrl: './household.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdPage implements OnInit {
  protected readonly books = inject(BooksStore);
  protected readonly household = inject(HouseholdStore);
  protected readonly invitations = inject(InvitationsStore);
  private readonly session = inject(SessionStore);
  private readonly confirm = inject(UiConfirm);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(UiDialog);

  protected readonly ready = signal(false);
  protected readonly busy = signal<Busy>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly renaming = signal(false);
  protected readonly renameError = signal<string | null>(null);
  protected readonly answering = signal<{ id: string; answer: InvitationAnswer } | null>(null);
  protected readonly selfId = computed(() => this.session.account()?.id ?? null);

  async ngOnInit(): Promise<void> {
    await this.books.load();
    if (this.household.household() === null) await this.invitations.load();
    else await this.household.loadDetail();
    this.ready.set(true);
  }

  protected startRename(): void {
    this.message.set(null);
    this.renameError.set(null);
    this.renaming.set(true);
  }

  protected async rename(name: string): Promise<void> {
    this.renameError.set(null);
    const result = await this.run('rename', () => this.household.rename(name));
    if (result.outcome === 'done') {
      this.renaming.set(false);
      this.toast.show({ message: this.translate.instant('households.household.renamed') });
      return;
    }
    const onField = fieldMessage(this.translate, result.error, 'name');
    if (onField !== null) this.renameError.set(onField);
    else await this.fail(result.error);
  }

  protected async deleteHousehold(): Promise<void> {
    if (!(await this.ask('deleteConfirm'))) return;
    const result = await this.run('delete', () => this.household.deleteHousehold());
    if (result.outcome === 'done') {
      await this.goToWorkspace();
      return;
    }
    if (result.error.code === 'household.forbidden') await this.household.loadHousehold();
    await this.fail(result.error);
  }

  protected async removeMember(person: Member): Promise<void> {
    if (!(await this.ask('removeConfirm', { name: person.name }))) return;
    const result = await this.run('remove', () => this.household.removeMember(person.id));
    if (result.outcome === 'done') this.toast.show({ message: this.translate.instant('households.household.removed') });
    else await this.fail(result.error);
  }

  protected async leave(): Promise<void> {
    if (!(await this.ask('leaveConfirm'))) return;
    const result = await this.run('leave', () => this.household.leave());
    if (result.outcome === 'done') await this.goToWorkspace();
    else await this.fail(result.error);
  }

  protected async openInvite(): Promise<void> {
    const ref = this.dialog.open<InviteSheetResult, undefined, InviteSheet>(InviteSheet, { size: 'md', presentation: 'auto' });
    if ((await firstValueFrom(ref.closed, { defaultValue: undefined })) === 'gone') await this.gone();
  }

  protected async cancelInvitation(invitation: Invitation): Promise<void> {
    const result = await this.run('cancel', () => this.household.cancelInvitation(invitation.id));
    if (result.outcome === 'error') await this.fail(result.error);
  }

  protected answerFor(id: string): InvitationAnswer | null {
    const current = this.answering();
    return current?.id === id ? current.answer : null;
  }

  protected async answer(id: string, answer: InvitationAnswer): Promise<void> {
    if (this.answering() !== null) return;
    this.answering.set({ id, answer });
    this.message.set(null);
    const result = answer === 'accept' ? await this.invitations.accept(id) : await this.invitations.decline(id);
    this.answering.set(null);
    if (result.outcome === 'error') {
      this.message.set(householdsMessage(this.translate, result.error));
      return;
    }
    if (answer === 'decline') this.toast.show({ message: this.translate.instant('households.invitation.declined') });
    else await this.household.loadDetail();
  }

  private async run(busy: Exclude<Busy, null>, call: () => Promise<StoreResult>): Promise<StoreResult> {
    this.busy.set(busy);
    this.message.set(null);
    const result = await call();
    this.busy.set(null);
    return result;
  }

  private ask(key: string, params: Record<string, string> = {}): Promise<boolean> {
    return this.confirm.ask({
      title: this.translate.instant(`households.household.${key}.title`),
      message: this.translate.instant(`households.household.${key}.message`, params),
      confirmLabel: this.translate.instant(`households.household.${key}.confirm`),
      tone: 'danger',
    });
  }

  private async fail(error: ApiError): Promise<void> {
    if (error.code === 'household.not_found') {
      await this.gone();
      return;
    }
    this.renaming.set(false);
    this.message.set(householdsMessage(this.translate, error));
  }

  private async gone(): Promise<void> {
    await this.books.load({ force: true });
    this.toast.show({ message: this.translate.instant('households.household.gone') });
    await this.goToWorkspace();
  }

  private async goToWorkspace(): Promise<void> {
    await this.router.navigateByUrl(this.books.books().length > 0 ? '/' : '/bienvenue');
  }
}
