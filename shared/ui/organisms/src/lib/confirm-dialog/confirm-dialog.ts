import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { UiButton } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';
import { firstValueFrom } from 'rxjs';
import { UI_DIALOG_CONTEXT, UiDialog } from '../dialog/dialog';
import { UiDialogBody, UiDialogFooter, UiDialogHeader } from '../dialog/dialog-parts';

export type UiConfirmTone = 'primary' | 'danger';

export interface UiConfirmOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly tone?: UiConfirmTone;
}

@Component({
  imports: [UiDialogHeader, UiDialogBody, UiDialogFooter, UiButton],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiConfirmContent {
  protected readonly options: UiConfirmOptions = inject(DIALOG_DATA);
  protected readonly context = inject(UI_DIALOG_CONTEXT);
  protected readonly text = inject(UI_TEXT);
}

@Injectable({ providedIn: 'root' })
export class UiConfirm {
  private readonly dialog = inject(UiDialog);

  async ask(options: UiConfirmOptions): Promise<boolean> {
    const ref = this.dialog.open<boolean, UiConfirmOptions, UiConfirmContent>(UiConfirmContent, {
      data: options,
      size: 'sm',
      role: 'alertdialog',
      autoFocus: options.tone === 'danger' ? '.ui-confirm__cancel' : '.ui-confirm__confirm',
    });
    return (await firstValueFrom(ref.closed)) === true;
  }
}
