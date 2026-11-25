import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton } from '@shared/ui-atoms';
import { UiList, UiListItem } from '@shared/ui-molecules';
import { LocalIsoDatePipe } from '@shared/util-format';
import { Invitation } from '../data/models';

@Component({
  selector: 'app-sent-invitations',
  imports: [LocalIsoDatePipe, TranslatePipe, UiButton, UiList, UiListItem],
  template: `
    @if (ordered().length === 0) {
      <p class="m-0">{{ 'households.household.noInvitations' | translate }}</p>
    } @else {
      <ui-list>
        @for (invitation of ordered(); track invitation.id) {
          <li uiListItem>
            <span uiTitle><bdi dir="ltr">{{ invitation.email }}</bdi></span>
            <span uiSubtitle>{{ 'households.invitation.expires' | translate }} {{ invitation.expiresAt | uiLocalIsoDate }}</span>
            <span uiTrailing>
              <button
                uiButton
                variant="ghost"
                size="sm"
                type="button"
                [attr.aria-label]="('households.household.cancelInvitation' | translate) + ' ' + invitation.email"
                (click)="cancelInvitation.emit(invitation)"
              >
                {{ 'households.household.cancelInvitation' | translate }}
              </button>
            </span>
          </li>
        }
      </ui-list>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentInvitations {
  readonly invitations = input.required<readonly Invitation[]>();
  readonly cancelInvitation = output<Invitation>();

  protected readonly ordered = computed(() => [...this.invitations()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
}
