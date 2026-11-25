import { ChangeDetectionStrategy, Component, contentChild } from '@angular/core';
import { UiTabAction, UiToastRegion } from '@shared/ui-organisms';

@Component({
  selector: 'ui-app-shell',
  imports: [UiToastRegion],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.ui-app-shell--tab-action]': 'tabAction() !== undefined' },
})
export class UiAppShell {
  protected readonly tabAction = contentChild(UiTabAction);
}
