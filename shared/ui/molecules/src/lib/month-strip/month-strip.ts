import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  viewChildren,
} from '@angular/core';
import { isRtl } from '@shared/ui-tokens';

export type UiMonthStatus = 'closed' | 'current' | 'planned' | 'todo';

export interface UiMonthStripItem {
  readonly month: string;
  readonly label: string;
  readonly caption?: string;
  readonly status?: UiMonthStatus;
  readonly statusLabel?: string;
}

@Component({
  selector: 'ui-month-strip',
  templateUrl: './month-strip.html',
  styleUrl: './month-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.ui-month-strip--compact]': 'compact()',
  },
})
export class UiMonthStrip {
  readonly months = input.required<readonly UiMonthStripItem[]>();
  readonly selected = model.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly compact = input(false, { transform: booleanAttribute });

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('month');

  protected readonly selectedIndex = computed(() => this.months().findIndex((item) => item.month === this.selected()));
  protected readonly focusIndex = linkedSignal(() => Math.max(this.selectedIndex(), 0));

  constructor() {
    effect(() => {
      const index = this.selectedIndex();
      afterNextRender(() => this.buttons()[index]?.nativeElement.scrollIntoView?.({ block: 'nearest', inline: 'center' }), { injector: this.injector });
    });
  }

  protected accessibleName(item: UiMonthStripItem): string {
    const name = item.caption ? `${item.label} ${item.caption}` : item.label;
    return item.statusLabel ? `${name} : ${item.statusLabel}` : name;
  }

  protected choose(month: string): void {
    if (month !== this.selected()) this.selected.set(month);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const target = this.targetIndex(event.key, index);
    if (target === null) return;
    event.preventDefault();
    this.focusIndex.set(target);
    this.buttons()[target]?.nativeElement.focus();
  }

  private targetIndex(key: string, from: number): number | null {
    const last = this.months().length - 1;
    const forward = isRtl(this.host) ? -1 : 1;
    const clamp = (index: number) => Math.min(Math.max(index, 0), last);
    switch (key) {
      case 'ArrowRight':
        return clamp(from + forward);
      case 'ArrowLeft':
        return clamp(from - forward);
      case 'Home':
        return 0;
      case 'End':
        return last;
      default:
        return null;
    }
  }
}
