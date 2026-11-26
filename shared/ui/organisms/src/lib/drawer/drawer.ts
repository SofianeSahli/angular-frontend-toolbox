import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Direction } from '@angular/cdk/bidi';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

export interface UiDrawerConfig<D> {
  readonly title: string;
  readonly data?: D;
}

export interface UiDrawerContext {
  readonly title: string;
  close(result?: unknown): void;
}

export const UI_DRAWER_CONTEXT = new InjectionToken<UiDrawerContext>('UI_DRAWER_CONTEXT');

const HISTORY_KEY = 'uiDrawer';
// A browser that never answers history.back() must not leave the caller waiting forever.
const HISTORY_FALLBACK_MS = 400;

let nextDrawerId = 0;

export class UiDrawerRef<R> {
  constructor(
    private readonly dialogRef: Pick<DialogRef<R>, 'close'>,
    readonly closed: Observable<R | undefined>,
  ) {}

  close(result?: R): void {
    this.dialogRef.close(result);
  }
}

@Injectable({ providedIn: 'root' })
export class UiDrawer {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);

  open<R = unknown, D = unknown, C = unknown>(component: ComponentType<C>, config: UiDrawerConfig<D>): UiDrawerRef<R> {
    const view = this.document.defaultView;
    const root = this.document.documentElement;
    const marker = `ui-drawer-${nextDrawerId++}`;
    const dialogRef = this.dialog.open<R, D, C>(component, {
      data: config.data,
      role: 'dialog',
      ariaLabel: config.title,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      direction: this.direction(),
      height: '100%',
      maxWidth: '100vw',
      panelClass: 'ui-drawer-pane',
      backdropClass: 'ui-overlay-backdrop',
      positionStrategy: this.overlay.position().global().top('0').start('0'),
      providers: (ref) => [{ provide: UI_DRAWER_CONTEXT, useValue: { title: config.title, close: (result?: R) => ref.close(result) } satisfies UiDrawerContext }],
    });

    const history = view?.history;
    history?.pushState({ ...(history.state ?? {}), [HISTORY_KEY]: marker }, '');
    let poppedByUser = false;
    const onPop = () => {
      poppedByUser = true;
      dialogRef.close();
    };
    view?.addEventListener('popstate', onPop);

    const followDirection = view?.MutationObserver
      ? new view.MutationObserver(() => {
          dialogRef.overlayRef.setDirection(this.direction());
          dialogRef.overlayRef.updatePosition();
        })
      : null;
    followDirection?.observe(root, { attributes: true, attributeFilter: ['dir'] });

    const closed = new ReplaySubject<R | undefined>(1);
    dialogRef.closed.subscribe((result) => {
      followDirection?.disconnect();
      view?.removeEventListener('popstate', onPop);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        closed.next(result);
        closed.complete();
      };
      if (poppedByUser || !view || history?.state?.[HISTORY_KEY] !== marker) {
        finish();
        return;
      }
      // The router reacts to popstate in a later task; emitting before it lets that sync cancel the caller's navigation.
      view.addEventListener('popstate', () => view.setTimeout(finish), { once: true });
      view.setTimeout(finish, HISTORY_FALLBACK_MS);
      history.back();
    });

    return new UiDrawerRef<R>(dialogRef, closed.asObservable());
  }

  private direction(): Direction {
    return this.document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';
  }
}
