import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { UI_TEXT } from '@shared/ui-tokens';

@Component({
  selector: 'label[uiLabel]',
  templateUrl: './label.html',
  styleUrl: './label.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLabel {
  readonly optional = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly text = inject(UI_TEXT);
}
