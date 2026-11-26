import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CurrencyFormat, todayIn } from '@shared/util-format';
import { firstValueFrom } from 'rxjs';
import { BudgetApi } from '../../budget/data/budget-api';
import { formatWhole } from '../../dashboard/support/whole-units';
import { BooksStore } from '../../households/data/books.store';
import { HouseholdStore } from '../../households/data/household.store';
import { HouseholdsApi } from '../../households/data/households-api';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { currentMonth } from '../../ledger/month-context';
import { quietReads } from '../../ledger/quiet-reads';
import { uiLocale } from '../../operations/support/day-groups';
import { RecurringApi } from '../../recurring/data/recurring-api';
import { isLive } from '../../recurring/support/monthly-average';

interface BudgetHint {
  readonly month: string;
  readonly remaining: number;
  readonly currency: CurrencyFormat;
}

function settle<T>(pending: Promise<T>, write: (value: T) => void): void {
  pending.then(write, () => undefined);
}

@Injectable()
export class DrawerHints {
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();
  private readonly budgetValue = signal<BudgetHint | null>(null);
  private readonly rulesValue = signal<number | null>(null);
  private readonly membersValue = signal<number | null>(null);

  readonly budget = computed(() => {
    this.revision();
    const hint = this.budgetValue();
    if (hint === null) return null;
    const [year, month] = hint.month.split('-').map(Number);
    const monthName = new Intl.DateTimeFormat(uiLocale(this.translate.getCurrentLang()), { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
    return this.translate.instant('shell.drawer.hints.budget', { month: monthName, amount: formatWhole(hint.remaining, hint.currency) });
  });

  readonly rules = computed(() => {
    this.revision();
    const count = this.rulesValue();
    return count === null ? null : this.translate.instant(count === 1 ? 'shell.drawer.hints.rule' : 'shell.drawer.hints.rules', { count });
  });

  readonly members = computed(() => {
    this.revision();
    const count = this.membersValue();
    return count === null ? null : this.translate.instant(count === 1 ? 'shell.drawer.hints.member' : 'shell.drawer.hints.members', { count });
  });

  constructor() {
    const book = inject(BooksStore).selectedBook();
    const household = inject(HouseholdStore).household();
    if (book !== null) {
      const month = currentMonth(todayIn(book.timezone));
      settle(firstValueFrom(inject(BudgetApi).get(book.id, month, quietReads())), (budget) => {
        if (budget.hasPlan && budget.expenses.remaining !== null) this.budgetValue.set({ month, remaining: budget.expenses.remaining, currency: book.currency });
      });
      settle(firstValueFrom(inject(RecurringApi).list(book.id, quietReads())), (rules) => this.rulesValue.set(rules.filter(isLive).length));
    }
    if (household !== null) {
      settle(firstValueFrom(inject(HouseholdsApi).members(household.id, quietReads())), (members) => this.membersValue.set(members.length));
    }
  }
}
