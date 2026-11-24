import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from '@shared/ui-atoms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiDialog } from './dialog';
import { UiDialogBody, UiDialogFooter, UiDialogHeader } from './dialog-parts';

@Component({
  imports: [UiDialogHeader, UiDialogBody, UiDialogFooter, UiButton],
  template: `<ui-dialog-header title="Nouvelle dépense" />
    <div uiDialogBody>{{ data }}</div>
    <div uiDialogFooter><button uiButton variant="primary">Enregistrer</button></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExpenseDialog {
  protected readonly data = inject(DIALOG_DATA);
}

const ESCAPE_KEY_CODE = 27;
const settle = () => new Promise((resolve) => setTimeout(resolve));
const pane = () => document.querySelector('.ui-dialog-pane');

function stubDevice(phone: boolean): void {
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn(() => ({ matches: phone })) });
}

async function openFromButton() {
  await render('<button type="button">Ouvrir</button>');
  const opener = screen.getByRole('button', { name: 'Ouvrir' });
  opener.focus();
  const ref = TestBed.inject(UiDialog).open(ExpenseDialog, { data: 'Carrefour Market' });
  await settle();
  return { opener, ref };
}

describe('UiDialog', () => {
  afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

  it('opens a dialog labelled by its title, with its data, focused inside', async () => {
    stubDevice(false);
    await openFromButton();
    const dialog = screen.getByRole('dialog', { name: 'Nouvelle dépense' });
    expect(dialog.textContent).toContain('Carrefour Market');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(pane()?.classList).toContain('ui-dialog-pane--md');
    expect(pane()?.classList).not.toContain('ui-dialog-pane--sheet');
  });

  it('becomes a bottom sheet below the medium breakpoint, with a handle and stacked footer', async () => {
    stubDevice(true);
    await openFromButton();
    expect(pane()?.classList).toContain('ui-dialog-pane--sheet');
    expect(document.querySelector('.ui-dialog-header__handle')).toBeTruthy();
    expect(document.querySelector('[uiDialogFooter]')?.classList).toContain('ui-dialog-footer--sheet');
  });

  it('closes with its close button and returns focus to the opener', async () => {
    stubDevice(false);
    const { opener, ref } = await openFromButton();
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    await settle();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape', async () => {
    stubDevice(false);
    const { ref } = await openFromButton();
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape', keyCode: ESCAPE_KEY_CODE });
    await settle();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('closes on a backdrop click', async () => {
    stubDevice(false);
    const { ref } = await openFromButton();
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    (document.querySelector('.ui-overlay-backdrop') as HTMLElement).click();
    await settle();
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
