import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon, UiRadio } from '@shared/ui-atoms';
import { UiValueAccessor, provideValueAccessor } from '../shared/value-accessor';

export interface UiOptionCard<T> {
  readonly value: T;
  readonly title: string;
  readonly description: string;
  readonly icon?: string;
}

let nextGroupId = 0;

@Component({
  selector: 'ui-option-cards',
  imports: [UiRadio, UiIcon],
  templateUrl: './option-cards.html',
  styleUrl: './option-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideValueAccessor(() => UiOptionCards)],
})
export class UiOptionCards<T> extends UiValueAccessor<T> {
  readonly options = input.required<readonly UiOptionCard<T>[]>();
  readonly legend = input.required<string>();

  protected readonly groupName = `ui-option-cards-${nextGroupId++}`;

  protected isSelected(option: UiOptionCard<T>): boolean {
    return Object.is(this.value(), option.value);
  }

  protected select(option: UiOptionCard<T>): void {
    this.commit(option.value);
  }
}
