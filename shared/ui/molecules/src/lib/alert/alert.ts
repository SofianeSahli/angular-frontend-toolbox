import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, output } from '@angular/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';

export type UiAlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_ICONS: Readonly<Record<UiAlertTone, string>> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-exclamation-point',
  danger: 'circle-x',
};

@Component({
  selector: 'ui-alert',
  imports: [UiIcon, UiButton],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"ui-alert--" + tone()',
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
  },
})
export class UiAlert {
  readonly tone = input<UiAlertTone>('info');
  readonly title = input<string>();
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissed = output<void>();

  protected readonly text = inject(UI_TEXT);
  protected readonly icon = computed(() => TONE_ICONS[this.tone()]);
}
