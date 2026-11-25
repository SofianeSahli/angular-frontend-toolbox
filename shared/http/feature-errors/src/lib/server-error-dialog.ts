import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton } from '@shared/ui-atoms';
import { UI_DIALOG_CONTEXT, UiDialogBody, UiDialogFooter, UiDialogHeader } from '@shared/ui-organisms';

export interface ServerErrorDialogData {
  readonly requestId: string;
}

export type ServerErrorDialogResult = 'retry' | undefined;

@Component({
  imports: [UiDialogHeader, UiDialogBody, UiDialogFooter, UiButton, TranslatePipe],
  templateUrl: './server-error-dialog.html',
  styleUrl: './server-error-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorDialog {
  protected readonly data: ServerErrorDialogData = inject(DIALOG_DATA);
  protected readonly context = inject(UI_DIALOG_CONTEXT);
}
