import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiChip, UiIcon } from '@shared/ui-atoms';
import { UiMenu, UiMenuItemRadio, UiMenuTrigger, UiMonthSwitcher, UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { UiDialog, UiFilterBar } from '@shared/ui-organisms';
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
  imports: [
    CategoryChip,
    FormsModule,
    TranslatePipe,
    UiButton,
    UiChip,
    UiFilterBar,
    UiIcon,
    UiMenu,
    UiMenuItemRadio,
    UiMenuTrigger,
    UiMonthSwitcher,
    UiSegmentedControl,
  ],
  template: `
    <ui-filter-bar>
      <ui-month-switcher variant="plain" [month]="month()" [locale]="locale()" (monthChange)="setMonth($event)" />
      <ui-segmented-control
        [options]="typeOptions()"
        [ariaLabel]="'operations.filters.type' | translate"
        [ngModel]="typeChoice()"
        (ngModelChange)="setType($event)"
      />
      @if (filters().category; as code) {
      <button
        uiChip
        pressed
        type="button"
        [attr.aria-label]="'operations.filters.removeCategory' | translate : { name: categoryName() }"
        (click)="changed.emit({ category: null })"
      >
        <app-category-chip [code]="code" />
        <ui-icon name="x" />
      </button>
      } @else {
      <button uiButton variant="secondary" size="sm" type="button" (click)="pickCategory()">
        {{ 'operations.filters.category' | translate }}
      </button>
      }
      <button uiButton variant="secondary" size="sm" type="button" [uiMenuTriggerFor]="authorMenu">
        <span class="visually-hidden">{{ 'operations.filters.author' | translate }} :</span>
        <bdi>{{ authorLabel() }}</bdi>
        <ui-icon name="chevron-down" />
      </button>
      <ng-template #authorMenu>
        <ui-menu>
          <button uiMenuItem [checked]="filters().author === null" (triggered)="changed.emit({ author: null })">
            {{ 'operations.filters.allAuthors' | translate }}
          </button>
          @for (person of authors(); track person.id) {
          <button uiMenuItem [checked]="filters().author === person.id" (triggered)="changed.emit({ author: person.id })">
            <bdi>{{ person.name }}</bdi>
          </button>
          }
        </ui-menu>
      </ng-template>
      @if (narrowed()) {
      <button uiFilterReset uiButton variant="ghost" size="sm" type="button" (click)="clear.emit()">
        {{ 'operations.filters.clear' | translate }}
      </button>
      }
    </ui-filter-bar>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsFilters {
  readonly filters = input.required<EntryFilters>();
  readonly authors = input<readonly Person[]>([]);
  readonly locale = input('fr-TN');
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
    return person?.name ?? this.translate.instant(id === null ? 'operations.filters.allAuthors' : 'operations.filters.author');
  });
  protected readonly typeOptions = computed<readonly UiSegmentedOption<TypeChoice>[]>(() => {
    this.revision();
    return [
      { value: 'all', label: this.translate.instant('operations.filters.all') },
      {
        value: 'expense',
        label: this.translate.instant('operations.filters.types.expense'),
      },
      {
        value: 'income',
        label: this.translate.instant('operations.filters.types.income'),
      },
      {
        value: 'saving',
        label: this.translate.instant('operations.filters.types.saving'),
      },
    ];
  });

  protected setMonth(month: string): void {
    this.changed.emit(monthRange(month));
  }

  protected setType(choice: TypeChoice | null): void {
    this.changed.emit({
      type: choice === null || choice === 'all' ? null : choice,
    });
  }

  protected async pickCategory(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, { mode: 'filter' });
    if (code !== null) this.changed.emit({ category: code });
  }
}
