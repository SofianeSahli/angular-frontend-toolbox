import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiBadge, UiButton, UiIcon } from '@shared/ui-atoms';
import { UiList, UiListItem, UiMenu, UiMenuItem, UiMenuTrigger } from '@shared/ui-molecules';
import { Member } from '../../data/models';

@Component({
  selector: 'app-members-list',
  imports: [TranslatePipe, UiBadge, UiButton, UiIcon, UiList, UiListItem, UiMenu, UiMenuItem, UiMenuTrigger],
  templateUrl: './members-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersList {
  readonly members = input.required<readonly Member[]>();
  readonly selfId = input<string | null>(null);
  readonly canRemove = input(false);
  readonly remove = output<Member>();
}
