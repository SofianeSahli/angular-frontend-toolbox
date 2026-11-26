import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';
import { UI_DIALOG_CONTEXT } from '../dialog';

@Component({
  selector: 'ui-dialog-header',
  imports: [UiButton, UiIcon],
  templateUrl: './ui-dialog-header.html',
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
  templateUrl: './ui-dialog-body.html',
  styleUrl: './dialog-body.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog-body' },
})
export class UiDialogBody {}

@Component({
  selector: '[uiDialogFooter]',
  templateUrl: './ui-dialog-footer.html',
  styleUrl: './dialog-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-dialog-footer',
    '[class.ui-dialog-footer--sheet]': 'context?.sheet === true',
  },
})
export class UiDialogFooter {
  protected readonly context = inject(UI_DIALOG_CONTEXT, { optional: true });
}
