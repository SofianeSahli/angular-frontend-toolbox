import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiMonthSwitcher } from '@shared/ui-molecules';
import { UiPage } from '@shared/ui-templates';
import { todayIn } from '@shared/util-format';
import { map } from 'rxjs';
import { CategoriesStore } from '../../categories/data/categories.store';
import { shownStatus } from '../../dashboard/data/card';
import { BooksStore } from '../../households/data/books.store';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { MIN_MONTH, MONTH_PARAM, maxMonth, monthFromQuery } from '../../ledger/month-context';
import { uiLocale } from '../../operations/support/day-groups';
import { AnalysisStore } from '../data/analysis.store';
import { CategoriesCard } from '../parts/categories-card';
import { MembersCard, showsMembers } from '../parts/members-card';
import { PaceCard } from '../parts/pace-card';
import { TrendCard } from '../parts/trend-card';

const DEFAULT_TIMEZONE = 'Africa/Tunis';

@Component({
  selector: 'app-analysis-page',
  imports: [CategoriesCard, MembersCard, PaceCard, TranslatePipe, TrendCard, UiMonthSwitcher, UiPage],
  templateUrl: './analysis-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisPage implements OnInit, OnDestroy {
  protected readonly store = inject(AnalysisStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly book = this.books.selectedBook;
  protected readonly today = computed(() => todayIn(this.book()?.timezone ?? DEFAULT_TIMEZONE));
  private readonly queryMonth = toSignal(this.route.queryParamMap.pipe(map((params) => params.get(MONTH_PARAM))), { initialValue: null });
  protected readonly month = computed(() => monthFromQuery(this.queryMonth(), this.today()));
  protected readonly minMonth = MIN_MONTH;
  protected readonly maxMonth = computed(() => maxMonth(this.today()));
  protected readonly locale = computed(() => {
    this.revision();
    return uiLocale(this.translate.getCurrentLang());
  });
  protected readonly showMembers = computed(() =>
    showsMembers(this.book()?.owner.type === 'household', this.store.summary().status, this.store.summary().data),
  );
  protected readonly fixed = computed(() => (this.store.fixed().status === 'ready' ? this.store.fixed().data : null));
  protected readonly shownStatus = shownStatus;

  constructor() {
    effect(() => {
      const bookId = this.book()?.id ?? null;
      const month = this.month();
      untracked(() => {
        if (bookId === null || (this.store.bookId() === bookId && this.store.month() === month)) return;
        this.store.open(bookId, month);
      });
    });
  }

  ngOnInit(): void {
    void this.categories.load();
    this.store.setActive(true);
  }

  ngOnDestroy(): void {
    this.store.setActive(false);
  }

  protected setMonth(month: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [MONTH_PARAM]: month }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
