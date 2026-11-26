import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiChip, UiIcon } from '@shared/ui-atoms';
import { UiMenu, UiMenuItemRadio, UiMenuTrigger, UiMonthSwitcher } from '@shared/ui-molecules';
import { UiDialog } from '@shared/ui-organisms';
import { CategoryType } from '../../categories/data/models';
import { CategoryLabels } from '../../categories/data/category-labels';
import { CategoryChip } from '../../categories/parts/category-chip';
import { openCategoryPicker } from '../../categories/parts/category-picker';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { hasNarrowingFilters, monthOf, monthRange } from '../data/filters';
import { EntryFilters, Person } from '../data/models';

type TypeChoice = CategoryType | 'all';

@Component({
  selector: 'app-operations-filters',
  imports: [CategoryChip, TranslatePipe, UiButton, UiChip, UiIcon, UiMenu, UiMenuItemRadio, UiMenuTrigger, UiMonthSwitcher],
  templateUrl: './operations-filters.html',
  styleUrl: './operations-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsFilters {
  readonly filters = input.required<EntryFilters>();
  readonly authors = input<readonly Person[]>([]);
  readonly locale = input('fr-TN');
  readonly caption = input<string>();
  readonly showAuthors = input(true);
  readonly changed = output<Partial<EntryFilters>>();
  readonly clear = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly labels = inject(CategoryLabels);
  private readonly dialog = inject(UiDialog);
  private readonly revision = injectTranslationRevision();

  protected readonly month = computed(() => monthOf(this.filters()));
  protected readonly typeChoice = computed<TypeChoice>(() => this.filters().type ?? 'all');
  protected readonly narrowed = computed(() => hasNarrowingFilters(this.filters()));
  protected readonly categoryName = computed(() => {
    const code = this.filters().category;
    return code === null ? '' : this.labels.name(code);
  });
  protected readonly authorLabel = computed(() => {
    const id = this.filters().author;
    const person = id === null ? null : this.authors().find((candidate) => candidate.id === id);
    this.revision();
    return person?.name ?? this.translate.instant('operations.filters.author');
  });
  protected readonly typeOptions = computed<readonly { value: TypeChoice; label: string }[]>(() => {
    this.revision();
    return [
      { value: 'all', label: this.translate.instant('operations.filters.all') },
      { value: 'expense', label: this.translate.instant('operations.filters.types.expense') },
      { value: 'income', label: this.translate.instant('operations.filters.types.income') },
    ];
  });

  protected setMonth(month: string): void {
    this.changed.emit(monthRange(month));
  }

  protected setType(choice: TypeChoice): void {
    this.changed.emit({ type: choice === 'all' ? null : choice });
  }

  protected async pickCategory(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, { mode: 'filter' });
    if (code !== null) this.changed.emit({ category: code });
  }
}
