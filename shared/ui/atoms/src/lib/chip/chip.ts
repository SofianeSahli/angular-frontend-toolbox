import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'button[uiChip]',
  templateUrl: './chip.html',
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
