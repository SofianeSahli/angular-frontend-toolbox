import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { BudgetLine } from '../../budget/data/models';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { watchList } from '../support/watch-list';
import { formatWhole } from '../support/whole-units';
import { CardFrame } from './card-frame';

@Component({
  selector: 'app-watch-list-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiMeter],
  template: `<app-card-frame [heading]="'dashboard.watch.title' | translate">
    @if (rows().length === 0) {
      <p class="dashboard-card__muted">{{ 'dashboard.watch.empty' | translate }}</p>
    } @else {
      <ul class="watch-list">
        @for (row of rows(); track row.category) {
          <li>
            <a class="watch-list__row" routerLink="/operations" [queryParams]="{ mois: month(), categorie: row.category }">
              <span class="watch-list__head">
                <span><span aria-hidden="true">{{ row.emoji }}</span>&ngsp;<bdi>{{ row.name }}</bdi></span>
                <span class="dashboard-card__numbers">{{ row.percentText }}</span>
              </span>
              <ui-meter [value]="row.actual" [max]="row.planned" [state]="row.status" [label]="row.name" [valueText]="row.valueText" />
              <span class="dashboard-card__muted dashboard-card__numbers"><bdi>{{ row.valueText }}</bdi></span>
            </a>
          </li>
        }
      </ul>
    }
  </app-card-frame>`,
  styleUrls: ['./dashboard-card.scss', './watch-list-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchListCard {
  readonly lines = input.required<readonly BudgetLine[]>();
  readonly currency = input.required<CurrencyFormat>();
  readonly month = input.required<string>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly rows = computed(() => {
    this.revision();
    return watchList(this.lines()).map((line) => {
      const amounts = { actual: formatWhole(line.actual, this.currency()), planned: formatWhole(line.planned, this.currency()) };
      return {
        ...line,
        name: this.labels.name(line.category),
        emoji: this.labels.emoji(line.category),
        percentText: line.percent === null ? this.translate.instant('dashboard.watch.unplanned') : this.translate.instant('dashboard.percent', { percent: line.percent }),
        valueText: this.translate.instant('dashboard.watch.of', amounts),
      };
    });
  });
}
