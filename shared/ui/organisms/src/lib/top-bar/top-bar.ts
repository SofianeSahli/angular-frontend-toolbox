import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';

export type UiTopBarAlign = 'center' | 'start';

@Directive({ selector: '[uiTopBarTitle]' })
export class UiTopBarTitle {}

@Component({
  selector: 'ui-top-bar',
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    '[class.ui-top-bar--start]': 'align() === "start"',
  },
})
export class UiTopBar {
  readonly title = input<string>('');
  readonly align = input<UiTopBarAlign>('center');

  protected readonly customTitle = contentChild(UiTopBarTitle);
}
