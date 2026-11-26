import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiBarItem, UiBarList } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { CardStatus } from '../../../dashboard/data/card';
import { Summary } from '../../../dashboard/data/models';
import { topCategories } from '../../support/top-categories';
import { formatWhole } from '../../../dashboard/support/whole-units';
import { CardFrame } from '../../../dashboard/parts/card-frame/card-frame';

export const OTHERS_ROW = '__others';

@Component({
  selector: 'app-categories-card',
  imports: [CardFrame, TranslatePipe, UiBarList],
  templateUrl: './categories-card.html',
  styleUrl: '../../../dashboard/parts/dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesCard {
  readonly summary = input.required<Summary | null>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly month = input.required<string>();
  readonly retry = output<void>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly revision = injectTranslationRevision();

  protected readonly items = computed<readonly UiBarItem[]>(() => {
    this.revision();
    const summary = this.summary();
    if (summary === null) return [];
    const { rows, others } = topCategories(summary);
    const share = (value: number) => this.translate.instant('dashboard.percent', { percent: Math.round(value * 100) });
    const items: UiBarItem[] = rows.map((row) => ({
      id: row.code,
      label: `${this.labels.emoji(row.code)} ${this.labels.name(row.code)}`,
      value: row.total,
      valueText: formatWhole(row.total, this.currency()),
      shareText: share(row.share),
      clickable: true,
    }));
    if (others !== null) {
      items.push({
        id: OTHERS_ROW,
        label: this.translate.instant('dashboard.categories.others'),
        value: others.total,
        valueText: formatWhole(others.total, this.currency()),
        shareText: share(others.share),
      });
    }
    return items;
  });

  protected open(code: string): void {
    if (code === OTHERS_ROW) return;
    void this.router.navigate(['/operations'], { queryParams: { mois: this.month(), categorie: code } });
  }
}
