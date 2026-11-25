import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'kbd[uiKbd]',
  templateUrl: './kbd.html',
  styleUrl: './kbd.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-kbd--on-accent]': 'onAccent()',
  },
})
export class UiKbd {
  readonly onAccent = input(false, { transform: booleanAttribute });
}
