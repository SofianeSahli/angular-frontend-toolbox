import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../public/i18n/fr.json';
import { RenameForm } from './rename-form';

const t = fr.households.household;

async function renderForm() {
  const rename = vi.fn();
  const cancel = vi.fn();
  const view = await render(RenameForm, {
    providers: [provideTranslateService({ lang: 'fr' })],
    inputs: { name: 'Les Martin', busy: false, serverError: null },
    on: { rename, cancelled: cancel },
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { view, rename, cancel, field: () => screen.getByRole('textbox', { name: new RegExp(t.name) }) as HTMLInputElement };
}

describe('RenameForm', () => {
  it('starts with the current name and emits the trimmed new one', async () => {
    const { rename, field } = await renderForm();
    expect(field().value).toBe('Les Martin');
    await userEvent.clear(field());
    await userEvent.type(field(), '  Les Ben Ali ');
    await userEvent.click(screen.getByRole('button', { name: t.renameSave }));
    expect(rename).toHaveBeenCalledWith('Les Ben Ali');
  });

  it('refuses an empty name', async () => {
    const { rename, field } = await renderForm();
    await userEvent.clear(field());
    await userEvent.type(field(), '   ');
    await userEvent.click(screen.getByRole('button', { name: t.renameSave }));
    expect(rename).not.toHaveBeenCalled();
  });

  it('refuses a name longer than 60 characters', async () => {
    const { rename, field } = await renderForm();
    fireEvent.input(field(), { target: { value: 'x'.repeat(61) } });
    await userEvent.click(screen.getByRole('button', { name: t.renameSave }));
    expect(rename).not.toHaveBeenCalled();
  });

  it('emits cancelled', async () => {
    const { cancel } = await renderForm();
    await userEvent.click(screen.getByRole('button', { name: t.renameCancel }));
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('shows a server error on the field', async () => {
    const { view } = await renderForm();
    view.fixture.componentRef.setInput('serverError', 'Saisissez un nom valide.');
    view.detectChanges();
    expect(screen.getByText('Saisissez un nom valide.')).toBeTruthy();
  });
});
