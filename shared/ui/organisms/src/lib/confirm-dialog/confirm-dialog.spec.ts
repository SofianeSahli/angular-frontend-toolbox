import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiConfirm } from './confirm-dialog';

const ESCAPE_KEY_CODE = 27;
const settle = () => new Promise((resolve) => setTimeout(resolve));

async function ask(tone: 'primary' | 'danger' = 'danger') {
  await render('<button type="button">Supprimer la dépense</button>');
  const answer = TestBed.inject(UiConfirm).ask({
    title: 'Supprimer cette dépense ?',
    message: 'Elle disparaîtra du carnet du foyer.',
    confirmLabel: 'Supprimer',
    tone,
  });
  await settle();
  return answer;
}

describe('UiConfirm', () => {
  it('is an alert dialog with the message, a confirm verb and Cancel from UI_TEXT', async () => {
    void ask();
    await settle();
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer cette dépense ?' });
    expect(dialog.textContent).toContain('Elle disparaîtra du carnet du foyer.');
    expect(screen.getByRole('button', { name: 'Supprimer' }).classList).toContain('ui-button--danger');
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeTruthy();
  });

  it('puts the initial focus on Cancel for a danger confirmation', async () => {
    void ask('danger');
    await settle();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Annuler' }));
  });

  it('puts the initial focus on the confirm button otherwise', async () => {
    void ask('primary');
    await settle();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Supprimer' }));
  });

  it('resolves true only from the confirm button', async () => {
    const answer = ask();
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(await answer).toBe(true);
  });

  it('resolves false from Cancel and from Escape', async () => {
    const cancelled = ask();
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(await cancelled).toBe(false);

    const escaped = TestBed.inject(UiConfirm).ask({ title: 'Quitter ?', message: 'Les changements seront perdus.', confirmLabel: 'Quitter' });
    await settle();
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape', keyCode: ESCAPE_KEY_CODE });
    expect(await escaped).toBe(false);
  });
});
