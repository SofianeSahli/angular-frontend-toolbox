import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { CurrencyFormat } from '@shared/util-format';
import { Budget } from '../../budget/data/models';
import { formatWhole, perDayUnits } from '../support/whole-units';
import { CardFrame } from './card-frame';

@Component({
  selector: 'app-hero-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiButton, UiIcon],
  template: `<app-card-frame [heading]="'dashboard.hero.title' | translate">
    @if (exhausted()) {
      <p class="dashboard-card__over"><ui-icon name="circle-exclamation-point" />{{ 'dashboard.hero.exhausted' | translate }}</p>
    } @else {
      <p class="dashboard-card__amount">
        <bdi>{{ remaining() }}</bdi>
      </p>
      @if (perDay(); as day) {
        <p class="dashboard-card__muted dashboard-card__numbers">
          <bdi>{{ (day.low ? 'dashboard.hero.perDayLow' : 'dashboard.hero.perDay') | translate: { amount: day.amount } }}</bdi>
        </p>
      }
    }
    <p class="m-0 dashboard-card__numbers">
      {{ 'dashboard.hero.spent' | translate }} <bdi>{{ spent() }}</bdi>
    </p>
    <div class="dashboard-card__actions">
      <a uiButton variant="secondary" size="sm" routerLink="/budget" [queryParams]="{ mois: month() }">{{ 'dashboard.hero.manage' | translate }}</a>
    </div>
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCard {
  readonly budget = input.required<Budget>();
  readonly currency = input.required<CurrencyFormat>();
  readonly month = input.required<string>();

  protected readonly exhausted = computed(() => this.budget().expenses.remaining === 0 && this.budget().lines.length > 0);
  protected readonly remaining = computed(() => formatWhole(this.budget().expenses.remaining ?? 0, this.currency()));
  protected readonly spent = computed(() => formatWhole(this.budget().expenses.actual, this.currency()));
  protected readonly perDay = computed(() => {
    const currency = this.currency();
    const units = perDayUnits(this.budget().expenses.remaining, this.budget().daysLeft, currency.exponent);
    if (units === null) return null;
    const unit = 10 ** currency.exponent;
    return units === 0 ? { low: true, amount: formatWhole(unit, currency) } : { low: false, amount: formatWhole(units * unit, currency) };
  });
}
