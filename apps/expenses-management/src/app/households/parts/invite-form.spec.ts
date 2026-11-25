import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../public/i18n/fr.json';
import { InviteForm } from './invite-form';

const t = fr.households.household.invite;

async function renderForm() {
  const invite = vi.fn();
  const view = await render(InviteForm, {
    providers: [provideTranslateService({ lang: 'fr' })],
    inputs: { busy: false, serverError: null },
    on: { invite },
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  const field = () => screen.getByRole('textbox', { name: new RegExp(t.email) }) as HTMLInputElement;
  const submit = () => userEvent.click(screen.getByRole('button', { name: t.submit }));
  return { view, invite, field, submit };
}

describe('InviteForm', () => {
  it('emits the trimmed email', async () => {
    const { invite, field, submit } = await renderForm();
    await userEvent.type(field(), '  Sami@Exemple.tn ');
    await submit();
    expect(invite).toHaveBeenCalledWith('Sami@Exemple.tn');
  });

  it.each([
    ['empty', '   '],
    ['not an email', 'sami'],
  ])('refuses an %s address', async (_, value) => {
    const { invite, field, submit } = await renderForm();
    await userEvent.type(field(), value);
    await submit();
    expect(invite).not.toHaveBeenCalled();
  });

  it('refuses an address longer than 255 characters', async () => {
    const { invite, field, submit } = await renderForm();
    fireEvent.input(field(), { target: { value: `${'a'.repeat(250)}@exemple.tn` } });
    await submit();
    expect(invite).not.toHaveBeenCalled();
  });

  it('shows a server error on the field', async () => {
    const { view } = await renderForm();
    view.fixture.componentRef.setInput('serverError', fr.households.errors.invitation.self);
    view.detectChanges();
    expect(screen.getByText(fr.households.errors.invitation.self)).toBeTruthy();
  });

  it('clears the field on demand', async () => {
    const { view, field } = await renderForm();
    await userEvent.type(field(), 'sami@exemple.tn');
    view.fixture.componentInstance.clear();
    view.detectChanges();
    expect(field().value).toBe('');
  });
});
