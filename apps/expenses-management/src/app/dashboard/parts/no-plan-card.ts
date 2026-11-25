import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton } from '@shared/ui-atoms';
import { CurrencyFormat } from '@shared/util-format';
import { CardStatus, Comparison } from '../data/dashboard.store';
import { MonthPosition } from '../../ledger/month-context';
import { formatWhole } from '../support/whole-units';
import { CardFrame } from './card-frame';

@Component({
  selector: 'app-no-plan-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiButton],
  template: `<app-card-frame [heading]="'dashboard.noPlan.title' | translate" [status]="status()" [error]="error()" (retry)="retry.emit()">
    @if (comparison()) {
      <p class="dashboard-card__amount">
        <bdi>{{ current() }}</bdi>
      </p>
      @if (previous(); as before) {
        <p class="m-0 dashboard-card__numbers">
          {{ (sameDay() ? 'dashboard.noPlan.previousSameDay' : 'dashboard.noPlan.previousWhole') | translate }} <bdi>{{ before }}</bdi>
        </p>
        @if (difference(); as gap) {
          <p class="dashboard-card__muted dashboard-card__numbers">
            <bdi>{{ gap.key | translate: { amount: gap.amount } }}</bdi>
          </p>
        }
      }
    }
    <p class="dashboard-card__muted">{{ 'dashboard.noPlan.invite' | translate }}</p>
    <div class="dashboard-card__actions">
      <a uiButton variant="primary" size="sm" routerLink="/budget" [queryParams]="{ mois: month() }">{{ 'dashboard.noPlan.setBudget' | translate }}</a>
    </div>
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoPlanCard {
  readonly comparison = input.required<Comparison | null>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly month = input.required<string>();
  readonly position = input<MonthPosition>('current');
  readonly retry = output<void>();

  protected readonly sameDay = computed(() => this.position() === 'current');
  protected readonly current = computed(() => formatWhole(this.comparison()?.current ?? 0, this.currency()));
  protected readonly previous = computed(() => {
    const previous = this.comparison()?.previous ?? null;
    return previous === null ? null : formatWhole(previous, this.currency());
  });
  protected readonly difference = computed(() => {
    const values = this.comparison();
    if (values === null || values.previous === null) return null;
    const gap = values.current - values.previous;
    const key = gap > 0 ? 'dashboard.noPlan.more' : gap < 0 ? 'dashboard.noPlan.less' : 'dashboard.noPlan.same';
    return { key, amount: formatWhole(Math.abs(gap), this.currency()) };
  });
}
