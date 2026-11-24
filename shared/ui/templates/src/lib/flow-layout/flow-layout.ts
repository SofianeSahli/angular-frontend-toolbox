import { ChangeDetectionStrategy, Component, inject, input, numberAttribute, output } from '@angular/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiStepper } from '@shared/ui-molecules';
import { UI_TEXT } from '@shared/ui-tokens';

@Component({
  selector: 'ui-flow-layout',
  imports: [UiButton, UiIcon, UiStepper],
  templateUrl: './flow-layout.html',
  styleUrl: './flow-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFlowLayout {
  readonly title = input.required<string>();
  readonly lead = input<string>();
  readonly step = input(1, { transform: numberAttribute });
  readonly steps = input(1, { transform: numberAttribute });
  readonly back = output<void>();
  readonly exit = output<void>();

  protected readonly text = inject(UI_TEXT);
}
