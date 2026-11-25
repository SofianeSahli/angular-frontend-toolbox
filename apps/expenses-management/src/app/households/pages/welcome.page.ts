import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiOptionCard, UiOptionCards } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { UiFlowLayout } from '@shared/ui-templates';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { InvitationsStore } from '../data/invitations.store';
import { InvitationAnswer, ReceivedInvitationCard } from '../parts/received-invitation-card';
import { householdsMessage } from '../support/server-errors';

type Choice = 'household' | 'personal';
type WelcomeState = 'A' | 'B' | 'C';

@Component({
  selector: 'app-welcome-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UiButton, UiSkeleton, UiAlert, UiOptionCards, UiFlowLayout, ReceivedInvitationCard],
  template: `
    <ui-flow-layout
      [title]="'households.welcome.title' | translate"
      [lead]="'households.welcome.lead' | translate"
      (back)="leave()"
      (exit)="leave()"
    >
      @if (loading()) {
        <div class="d-flex flex-column gap-3" role="status" [attr.aria-label]="'households.welcome.loading' | translate">
          <ui-skeleton shape="block" />
          <ui-skeleton shape="block" />
        </div>
      } @else {
        @if (message(); as text) {
          <ui-alert tone="danger">{{ text }}</ui-alert>
        }
        @if (invitations.received().length > 0) {
          <section class="d-flex flex-column gap-3" [attr.aria-label]="'households.welcome.invitations' | translate">
            @for (invitation of invitations.received(); track invitation.id) {
              <app-received-invitation-card
                [invitation]="invitation"
                [busy]="busyId() === invitation.id ? busyAnswer() : null"
                (accept)="answer(invitation.id, 'accept')"
                (decline)="answer(invitation.id, 'decline')"
              />
            }
          </section>
        }
        @switch (state()) {
          @case ('A') {
            <ui-option-cards [legend]="'households.welcome.legend' | translate" [options]="options()" [formControl]="choice" />
          }
          @case ('B') {
            <section class="d-flex flex-column gap-2 p-3 border rounded">
              <h2 class="h5 m-0">{{ 'households.welcome.resume.title' | translate: { name: household.household()?.name } }}</h2>
              <a uiButton variant="primary" routerLink="/carnets/nouveau" [queryParams]="{ foyer: 1 }">
                {{ 'households.welcome.resume.action' | translate }}
              </a>
            </section>
          }
          @case ('C') {
            <ui-alert tone="info">{{ 'households.welcome.memberWaiting' | translate }}</ui-alert>
          }
        }
      }
      <div uiFlowFooter>
        @if (!loading()) {
          @if (state() === 'A') {
            <button uiButton variant="primary" type="button" (click)="next()">{{ 'households.welcome.continue' | translate }}</button>
          } @else {
            <a uiButton variant="secondary" routerLink="/carnets/nouveau">{{ 'households.welcome.personal.title' | translate }}</a>
          }
        }
      </div>
    </ui-flow-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage implements OnInit {
  protected readonly books = inject(BooksStore);
  protected readonly household = inject(HouseholdStore);
  protected readonly invitations = inject(InvitationsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly translate = inject(TranslateService);

  protected readonly choice = new FormControl<Choice>('household', { nonNullable: true });
  protected readonly ready = signal(false);
  protected readonly busyId = signal<string | null>(null);
  protected readonly busyAnswer = signal<InvitationAnswer | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly loading = computed(() => !this.ready() || this.books.status() === 'loading' || this.invitations.loading());
  protected readonly state = computed<WelcomeState>(() => {
    if (this.household.isOwner()) return 'B';
    return this.household.isMember() ? 'C' : 'A';
  });
  protected readonly options = computed<readonly UiOptionCard<Choice>[]>(() => [
    {
      value: 'household',
      title: this.translate.instant('households.welcome.household.title'),
      description: this.translate.instant('households.welcome.household.description'),
    },
    {
      value: 'personal',
      title: this.translate.instant('households.welcome.personal.title'),
      description: this.translate.instant('households.welcome.personal.description'),
    },
  ]);

  async ngOnInit(): Promise<void> {
    await this.books.load();
    await this.invitations.load();
    this.ready.set(true);
  }

  protected next(): void {
    void this.router.navigateByUrl(this.choice.value === 'household' ? '/foyer/nouveau' : '/carnets/nouveau');
  }

  protected leave(): void {
    void this.router.navigateByUrl('/');
  }

  protected async answer(id: string, answer: InvitationAnswer): Promise<void> {
    if (this.busyId() !== null) return;
    this.busyId.set(id);
    this.busyAnswer.set(answer);
    this.message.set(null);
    const result = answer === 'accept' ? await this.invitations.accept(id) : await this.invitations.decline(id);
    this.busyId.set(null);
    this.busyAnswer.set(null);
    if (result.outcome === 'error') {
      this.message.set(householdsMessage(this.translate, result.error));
      return;
    }
    if (answer === 'decline') {
      this.toast.show({ message: this.translate.instant('households.invitation.declined') });
      return;
    }
    const householdBook = this.books.householdBook();
    if (householdBook !== null) {
      this.books.select(householdBook.id);
      await this.router.navigateByUrl('/');
    }
  }
}
