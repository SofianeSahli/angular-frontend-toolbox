import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute } from '@angular/core';
import { UI_TEXT } from '@shared/ui-tokens';

export type UiSpinnerSize = 18 | 24;

@Component({
  selector: 'ui-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'accessibleName()',
    '[class.ui-spinner--24]': 'size() === 24',
  },
})
export class UiSpinner {
  readonly size = input<UiSpinnerSize, unknown>(18, { transform: (value) => numberAttribute(value, 18) as UiSpinnerSize });
  readonly label = input<string>();

  private readonly text = inject(UI_TEXT);

  protected readonly accessibleName = computed(() => this.label() ?? this.text.loading);
}
