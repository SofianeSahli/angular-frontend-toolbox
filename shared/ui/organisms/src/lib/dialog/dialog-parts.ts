import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';
import { UI_DIALOG_CONTEXT } from './dialog';

@Component({
  selector: 'ui-dialog-header',
  imports: [UiButton, UiIcon],
  template: `@if (context.sheet) {
      <span class="ui-dialog-header__handle" aria-hidden="true"></span>
    }
    <div class="ui-dialog-header__row">
      <h2 class="ui-dialog-header__title" [id]="context.titleId">{{ title() }}</h2>
      <button uiButton variant="ghost" size="sm" iconOnly type="button" [attr.aria-label]="text.close" (click)="context.close()">
        <ui-icon name="x" />
      </button>
    </div>`,
  styleUrl: './dialog-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDialogHeader {
  readonly title = input.required<string>();

  protected readonly context = inject(UI_DIALOG_CONTEXT);
  protected readonly text = inject(UI_TEXT);
}

@Component({
  selector: '[uiDialogBody]',
  template: '<ng-content />',
  styleUrl: './dialog-body.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDialogBody {}

@Component({
  selector: '[uiDialogFooter]',
  template: '<ng-content />',
  styleUrl: './dialog-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-dialog-footer--sheet]': 'context?.sheet === true',
  },
})
export class UiDialogFooter {
  protected readonly context = inject(UI_DIALOG_CONTEXT, { optional: true });
}
