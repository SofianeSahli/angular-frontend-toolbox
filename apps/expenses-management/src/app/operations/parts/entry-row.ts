import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiAmount, UiBadge } from '@shared/ui-atoms';
import { UiListItem } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { Entry } from '../data/models';
import { longDate, uiLocale } from '../support/day-groups';

@Component({
  selector: 'app-entry-row',
  imports: [TranslatePipe, UiAmount, UiBadge, UiListItem],
  templateUrl: './entry-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryRow {
  readonly entry = input.required<Entry>();
  readonly currency = input.required<CurrencyFormat>();
  readonly showAuthor = input(false);
  readonly open = output<Entry>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);

  protected readonly emoji = computed(() => this.labels.emoji(this.entry().category));
  protected readonly name = computed(() => this.entry().otherName || this.labels.name(this.entry().category));
  private readonly revision = injectTranslationRevision();

  protected readonly accessibleName = computed(() => {
    this.revision();
    const row = this.translate.instant('operations.list.row', {
      category: this.name(),
      amount: formatMinor(this.entry().amount, this.currency()),
      date: longDate(this.entry().date, uiLocale(this.translate.getCurrentLang())),
    });
    return this.entry().recurringRuleId === null ? row : `${row}, ${this.translate.instant('operations.recurringBadge')}`;
  });
}
