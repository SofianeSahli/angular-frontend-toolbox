import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton } from '@shared/ui-atoms';
import { LocalIsoDatePipe } from '@shared/util-format';
import { ReceivedInvitation } from '../data/models';

export type InvitationAnswer = 'accept' | 'decline';

@Component({
  selector: 'app-received-invitation-card',
  imports: [TranslatePipe, LocalIsoDatePipe, UiButton],
  template: `
    <article class="d-flex flex-column gap-2 p-3 border rounded" [attr.aria-label]="invitation().household.name">
      <h2 class="h5 m-0"><bdi>{{ invitation().household.name }}</bdi></h2>
      <p class="m-0">
        {{ 'households.invitation.invitedBy' | translate }} <bdi>{{ invitation().invitedBy.name }}</bdi>
      </p>
      <p class="m-0">{{ 'households.invitation.expires' | translate }} {{ invitation().expiresAt | uiLocalIsoDate }}</p>
      <div class="d-flex gap-2">
        <button
          uiButton
          variant="primary"
          type="button"
          [loading]="busy() === 'accept'"
          [disabled]="busy() !== null"
          (click)="accept.emit()"
        >
          {{ 'households.invitation.accept' | translate }}
        </button>
        <button
          uiButton
          variant="secondary"
          type="button"
          [loading]="busy() === 'decline'"
          [disabled]="busy() !== null"
          (click)="decline.emit()"
        >
          {{ 'households.invitation.decline' | translate }}
        </button>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivedInvitationCard {
  readonly invitation = input.required<ReceivedInvitation>();
  readonly busy = input<InvitationAnswer | null>(null);
  readonly accept = output<void>();
  readonly decline = output<void>();
}
