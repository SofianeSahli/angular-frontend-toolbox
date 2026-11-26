import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { firstValueFrom } from 'rxjs';
import { UI_DRAWER_CONTEXT, UiDrawer } from './drawer';

const ESCAPE_KEY_CODE = 27;

@Component({
  selector: 'ui-test-drawer-content',
  template: '<nav><a href="#accueil">Accueil</a><button type="button" (click)="context.close(\'picked\')">Choisir</button></nav>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DrawerContent {
  protected readonly context = inject(UI_DRAWER_CONTEXT);
}

function openDrawer() {
  return TestBed.inject(UiDrawer).open<string>(DrawerContent, { title: 'Menu' });
}

describe('UiDrawer', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => (node.innerHTML = ''));
  });

  it('opens a named dialog at the inline-start edge and pushes one history entry', async () => {
    const before = history.length;
    openDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(dialog.closest('.ui-drawer-pane')).toBeTruthy();
    expect(history.length).toBe(before + 1);
    expect(history.state.uiDrawer).toMatch(/^ui-drawer-/);
  });

  it('emits the result once the history entry is gone', async () => {
    const ref = openDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const result = firstValueFrom(ref.closed);
    await userEvent.click(screen.getByRole('button', { name: 'Choisir' }));
    expect(await result).toBe('picked');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('emits the result after tasks that other popstate listeners schedule', async () => {
    const order: string[] = [];
    const deferred = () => setTimeout(() => order.push('router'));
    window.addEventListener('popstate', deferred, { once: true });
    const ref = openDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const result = firstValueFrom(ref.closed).then(() => order.push('result'));
    await userEvent.click(screen.getByRole('button', { name: 'Choisir' }));
    await result;
    expect(order).toEqual(['router', 'result']);
  });

  it('closes on Escape', async () => {
    const ref = openDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const result = firstValueFrom(ref.closed);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape', keyCode: ESCAPE_KEY_CODE });
    expect(await result).toBeUndefined();
  });

  it('closes when the browser goes back', async () => {
    const ref = openDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const result = firstValueFrom(ref.closed);
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    expect(await result).toBeUndefined();
  });
});
