import { ChangeDetectionStrategy, Component, computed, effect, inject, input, isDevMode, model } from '@angular/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';

export type UiMonthSwitcherVariant = 'boxed' | 'plain';

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

function monthIndex(yearMonth: string): number | null {
  const match = YEAR_MONTH.exec(yearMonth);
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
}

function yearMonthOf(index: number): string {
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'ui-month-switcher',
  imports: [UiButton, UiIcon],
  templateUrl: './month-switcher.html',
  styleUrl: './month-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-month-switcher--plain]': 'variant() === "plain"',
  },
})
export class UiMonthSwitcher {
  readonly month = model.required<string>();
  readonly min = input<string>();
  readonly max = input<string>();
  readonly caption = input<string>();
  readonly variant = input<UiMonthSwitcherVariant>('boxed');
  readonly locale = input('fr-TN');

  protected readonly text = inject(UI_TEXT);

  private readonly current = computed(() => monthIndex(this.month()));

  protected readonly label = computed(() => {
    const index = this.current();
    if (index === null) return '';
    const firstDay = new Date(Math.floor(index / 12), index % 12, 1);
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(firstDay);
  });

  protected readonly atMin = computed(() => this.isAtLimit(this.min()));
  protected readonly atMax = computed(() => this.isAtLimit(this.max()));

  constructor() {
    effect(() => {
      if (isDevMode() && this.current() === null) console.error(`ui-month-switcher: "${this.month()}" is not a YYYY-MM month`);
    });
  }

  protected move(step: 1 | -1): void {
    const index = this.current();
    if (index === null || (step < 0 && this.atMin()) || (step > 0 && this.atMax())) return;
    this.month.set(yearMonthOf(index + step));
  }

  private isAtLimit(limit: string | undefined): boolean {
    const index = this.current();
    if (index === null) return true;
    return limit !== undefined && monthIndex(limit) === index;
  }
}
