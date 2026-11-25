import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiBarItem, UiBarList } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { CardStatus } from '../data/dashboard.store';
import { Summary } from '../data/models';
import { formatWhole } from '../support/whole-units';
import { CardFrame } from './card-frame';

export function showsMembers(isHousehold: boolean, status: CardStatus, summary: Summary | null): boolean {
  if (!isHousehold) return false;
  return status !== 'ready' || (summary?.members.length ?? 0) > 1;
}

@Component({
  selector: 'app-members-card',
  imports: [CardFrame, TranslatePipe, UiBarList],
  template: `<app-card-frame [heading]="'dashboard.members.title' | translate" [status]="status()" [error]="error()" (retry)="retry.emit()">
    <ui-bar-list [items]="items()" />
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersCard {
  readonly summary = input.required<Summary | null>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly retry = output<void>();

  protected readonly items = computed<readonly UiBarItem[]>(() =>
    (this.summary()?.members ?? []).map((member) => ({
      id: member.account.id,
      label: member.account.name,
      value: member.expense,
      valueText: formatWhole(member.expense, this.currency()),
    })),
  );
}
