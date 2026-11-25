import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiBadge, UiButton } from '@shared/ui-atoms';
import { UiList, UiListItem } from '@shared/ui-molecules';
import { Member } from '../data/models';

@Component({
  selector: 'app-members-list',
  imports: [TranslatePipe, UiBadge, UiButton, UiList, UiListItem],
  template: `
    <ui-list>
      @for (person of members(); track person.id) {
        <li uiListItem>
          <span uiTitle>
            <bdi>{{ person.name }}</bdi>
            @if (person.id === selfId()) {
              {{ 'households.household.you' | translate }}
            }
          </span>
          <span uiTrailing class="d-flex align-items-center gap-2">
            <ui-badge [tone]="person.role === 'owner' ? 'accent' : 'neutral'">
              {{ (person.role === 'owner' ? 'households.household.owner' : 'households.household.member') | translate }}
            </ui-badge>
            @if (canRemove() && person.id !== selfId()) {
              <button
                uiButton
                variant="ghost"
                size="sm"
                type="button"
                [attr.aria-label]="('households.household.remove' | translate) + ' ' + person.name"
                (click)="remove.emit(person)"
              >
                {{ 'households.household.remove' | translate }}
              </button>
            }
          </span>
        </li>
      }
    </ui-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersList {
  readonly members = input.required<readonly Member[]>();
  readonly selfId = input<string | null>(null);
  readonly canRemove = input(false);
  readonly remove = output<Member>();
}
