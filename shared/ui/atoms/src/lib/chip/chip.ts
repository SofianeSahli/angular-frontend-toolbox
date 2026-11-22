import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'button[uiChip]',
  template: `<ng-content />
    @if (count() !== undefined) {
      &ngsp;<span class="ui-chip__count">{{ count() }}</span>
    }`,
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'pressed() ? "true" : "false"',
  },
})
export class UiChip {
  readonly pressed = input(false, { transform: booleanAttribute });
  readonly count = input<number>();
}
