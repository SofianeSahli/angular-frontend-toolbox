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
  template: `<ui-dialog-header [title]="'errors.server.title' | translate" />
    <div uiDialogBody>
      <p>{{ 'errors.server.text' | translate }}</p>
      @if (data.requestId) {
        <p>
          {{ 'errors.server.requestId' | translate }}&ngsp;<code class="server-error-dialog__request-id">{{ data.requestId }}</code>
        </p>
      }
    </div>
    <div uiDialogFooter>
      <button uiButton type="button" (click)="context.close()">{{ 'errors.server.close' | translate }}</button>
      <button uiButton type="button" variant="primary" class="server-error-dialog__retry" (click)="context.close('retry')">
        {{ 'errors.server.retry' | translate }}
      </button>
    </div>`,
  styleUrl: './server-error-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorDialog {
  protected readonly data: ServerErrorDialogData = inject(DIALOG_DATA);
  protected readonly context = inject(UI_DIALOG_CONTEXT);
}
