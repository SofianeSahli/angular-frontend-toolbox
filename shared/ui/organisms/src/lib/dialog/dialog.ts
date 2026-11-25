import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { mediaQueryDown } from '@shared/ui-tokens';

export type UiDialogSize = 'sm' | 'md' | 'lg';
export type UiDialogPresentation = 'auto' | 'dialog' | 'sheet';

export interface UiDialogConfig<D> {
  readonly data?: D;
  readonly size?: UiDialogSize;
  readonly presentation?: UiDialogPresentation;
  readonly role?: 'dialog' | 'alertdialog';
  readonly autoFocus?: string;
}

export interface UiDialogContext {
  readonly titleId: string;
  readonly sheet: boolean;
  close(result?: unknown): void;
}

export const UI_DIALOG_CONTEXT = new InjectionToken<UiDialogContext>('UI_DIALOG_CONTEXT');

// The CDK injects unlayered pane styles (max-height: 100%) at runtime that beat @layer ui, so the cap goes inline.
const PANE_MAX_BLOCK_SIZE = 'var(--ui-overlays-pane-max-block-size)';

let nextTitleId = 0;

@Injectable({ providedIn: 'root' })
export class UiDialog {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly window = inject(DOCUMENT).defaultView;

  open<R = unknown, D = unknown, C = unknown>(component: ComponentType<C>, config: UiDialogConfig<D> = {}): DialogRef<R, C> {
    const sheet = this.presentsAsSheet(config.presentation ?? 'auto');
    const titleId = `ui-dialog-title-${nextTitleId++}`;
    return this.dialog.open<R, D, C>(component, {
      data: config.data,
      role: config.role ?? 'dialog',
      ariaLabelledBy: titleId,
      autoFocus: config.autoFocus ?? 'first-tabbable',
      maxHeight: PANE_MAX_BLOCK_SIZE,
      restoreFocus: true,
      panelClass: ['ui-dialog-pane', `ui-dialog-pane--${config.size ?? 'md'}`, ...(sheet ? ['ui-dialog-pane--sheet'] : [])],
      backdropClass: 'ui-overlay-backdrop',
      positionStrategy: sheet ? this.overlay.position().global().centerHorizontally().bottom('0') : undefined,
      providers: (dialogRef) => [
        { provide: UI_DIALOG_CONTEXT, useValue: { titleId, sheet, close: (result?: R) => dialogRef.close(result) } satisfies UiDialogContext },
      ],
    });
  }

  private presentsAsSheet(presentation: UiDialogPresentation): boolean {
    if (presentation !== 'auto') return presentation === 'sheet';
    return this.window?.matchMedia?.(mediaQueryDown('medium')).matches ?? false;
  }
}
