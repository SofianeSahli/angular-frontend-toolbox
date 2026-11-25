import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, viewChildren } from '@angular/core';
import { isRtl } from '@shared/ui-tokens';
import { UiValueAccessor, provideValueAccessor } from '../shared/value-accessor';

export interface UiSegmentedOption<T> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

type Step = 1 | -1;

@Component({
  selector: 'ui-segmented-control',
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideValueAccessor(() => UiSegmentedControl)],
  host: {
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class UiSegmentedControl<T> extends UiValueAccessor<T> {
  readonly options = input.required<readonly UiSegmentedOption<T>[]>();
  readonly ariaLabel = input.required<string>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly items = viewChildren<ElementRef<HTMLButtonElement>>('item');

  protected readonly selectedIndex = computed(() => this.options().findIndex((option) => Object.is(option.value, this.value())));
  protected readonly focusableIndex = computed(() => {
    const selected = this.selectedIndex();
    return selected >= 0 ? selected : this.options().findIndex((option) => !option.disabled);
  });

  protected select(index: number): void {
    const option = this.options()[index];
    if (!option || option.disabled || this.isDisabled()) return;
    this.commit(option.value);
    this.items()[index]?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const target = this.targetIndex(event.key, index);
    if (target === null) return;
    event.preventDefault();
    this.select(target);
  }

  private targetIndex(key: string, from: number): number | null {
    const forward: Step = isRtl(this.host) ? -1 : 1;
    switch (key) {
      case 'ArrowRight':
        return this.nextEnabled(from, forward);
      case 'ArrowLeft':
        return this.nextEnabled(from, forward === 1 ? -1 : 1);
      case 'ArrowDown':
        return this.nextEnabled(from, 1);
      case 'ArrowUp':
        return this.nextEnabled(from, -1);
      case 'Home':
        return this.nextEnabled(-1, 1);
      case 'End':
        return this.nextEnabled(this.options().length, -1);
      default:
        return null;
    }
  }

  private nextEnabled(from: number, step: Step): number | null {
    const options = this.options();
    for (let offset = 1; offset <= options.length; offset++) {
      const index = (((from + step * offset) % options.length) + options.length) % options.length;
      if (!options[index].disabled) return index;
    }
    return null;
  }
}
