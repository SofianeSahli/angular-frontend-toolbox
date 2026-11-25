import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { UiChip } from '@shared/ui-atoms';
import { UiValueAccessor, provideValueAccessor } from '../shared/value-accessor';

export interface UiChipOption<T> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
  readonly disabled?: boolean;
}

export type UiChipGroupMode = 'single' | 'multiple';

@Component({
  selector: 'ui-chip-group',
  imports: [UiChip],
  templateUrl: './chip-group.html',
  styleUrl: './chip-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideValueAccessor(() => UiChipGroup)],
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.ui-chip-group--scroll]': 'scroll()',
  },
})
export class UiChipGroup<T> extends UiValueAccessor<T | readonly T[]> {
  readonly options = input.required<readonly UiChipOption<T>[]>();
  readonly ariaLabel = input.required<string>();
  readonly mode = input<UiChipGroupMode>('single');
  readonly scroll = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  protected isPressed(option: UiChipOption<T>): boolean {
    const value = this.value();
    return Array.isArray(value) ? value.some((selected) => Object.is(selected, option.value)) : Object.is(value, option.value);
  }

  protected toggle(option: UiChipOption<T>): void {
    if (this.mode() === 'multiple') {
      this.commit(this.toggledSelection(option.value));
      return;
    }
    if (!this.isPressed(option)) this.commit(option.value);
    else if (!this.required()) this.commit(null);
  }

  private toggledSelection(value: T): readonly T[] {
    const current = this.value();
    const selection: readonly T[] = Array.isArray(current) ? current : [];
    return selection.some((selected) => Object.is(selected, value))
      ? selection.filter((selected) => !Object.is(selected, value))
      : [...selection, value];
  }
}
