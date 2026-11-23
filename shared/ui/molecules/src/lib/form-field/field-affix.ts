import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';

@Component({
  selector: '[uiPrefix], [uiSuffix]',
  template: '<ng-content />',
  styleUrl: './field-affix.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-field-affix--prefix]': 'isPrefix',
    '[class.ui-field-affix--suffix]': '!isPrefix',
  },
})
export class UiFieldAffix {
  readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly isPrefix = this.element.hasAttribute('uiPrefix');
}
