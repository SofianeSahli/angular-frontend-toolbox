import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiMonthSwitcher } from '@shared/ui-molecules';
import { UiPage } from '@shared/ui-templates';
import { todayIn } from '@shared/util-format';
import { map } from 'rxjs';
import { CategoriesStore } from '../../categories/data/categories.store';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { BooksStore } from '../../households/data/books.store';
import { EntrySheetService } from '../../operations/entry-sheet.service';
import { Entry } from '../../operations/data/models';
import { uiLocale } from '../../operations/support/day-groups';
import { DashboardStore, showsToday } from '../data/dashboard.store';
import { shownStatus } from '../data/card';
import { AnalysisLinkCard } from '../parts/analysis-link-card';
import { CardFrame } from '../parts/card-frame';
import { FirstUseCard } from '../parts/first-use-card';
import { HeroCard } from '../parts/hero-card';
import { NoPlanCard } from '../parts/no-plan-card';
import { RecentCard } from '../parts/recent-card';
import { UpcomingCard } from '../parts/upcoming-card';
import { WatchListCard } from '../parts/watch-list-card';
import { MIN_MONTH, MONTH_PARAM, maxMonth, monthFromQuery, positionOf } from '../../ledger/month-context';

const DEFAULT_TIMEZONE = 'Africa/Tunis';

export { shownStatus };

@Component({
  selector: 'app-dashboard-page',
  imports: [
    AnalysisLinkCard,
    CardFrame,
    FirstUseCard,
    HeroCard,
    NoPlanCard,
    RecentCard,
    TranslatePipe,
    UiMonthSwitcher,
    UiPage,
    UpcomingCard,
    WatchListCard,
  ],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit, OnDestroy {
  protected readonly store = inject(DashboardStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly sheets = inject(EntrySheetService);
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
  protected readonly position = computed(() => positionOf(this.month(), this.today()));
  protected readonly locale = computed(() => {
    this.revision();
    return uiLocale(this.translate.getCurrentLang());
  });
  protected readonly todayOnly = computed(() => showsToday(this.month(), this.today()));
  protected readonly shownStatus = shownStatus;

  private requested: string | null = null;

  constructor() {
    effect(() => {
      const bookId = this.book()?.id ?? null;
      const month = this.month();
      untracked(() => {
        if (bookId === null || (this.store.bookId() === bookId && this.store.month() === month)) return;
        this.requested = month;
        this.store.open(bookId, month);
      });
    });

    effect(() => {
      const shown = this.store.month();
      untracked(() => {
        if (shown === null || this.requested === null || shown === this.requested) return;
        this.requested = shown;
        this.setMonth(shown);
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

  protected add(): void {
    this.sheets.openNew();
  }

  protected edit(entry: Entry): void {
    this.sheets.openEdit(entry);
  }
}
