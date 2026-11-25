import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton } from '@shared/ui-atoms';
import { LocalIsoDatePipe } from '@shared/util-format';
import { ReceivedInvitation } from '../data/models';

export type InvitationAnswer = 'accept' | 'decline';

@Component({
  selector: 'app-received-invitation-card',
  imports: [TranslatePipe, LocalIsoDatePipe, UiButton],
  templateUrl: './received-invitation-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivedInvitationCard {
  readonly invitation = input.required<ReceivedInvitation>();
  readonly busy = input<InvitationAnswer | null>(null);
  readonly accept = output<void>();
  readonly decline = output<void>();
}
