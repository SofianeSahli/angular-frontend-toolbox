import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { SignUpDraft } from '../../shared/sign-up-draft';
import { failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { SignUpPage } from './sign-up.page';

async function fill(options: { phone?: string; terms?: boolean } = {}) {
  await userEvent.type(screen.getByLabelText(fr.identity.fields.name), 'Amira');
  await userEvent.type(screen.getByLabelText(fr.identity.fields.email), 'amira@exemple.com');
  await userEvent.type(screen.getByLabelText(fr.identity.fields.password), 'secret-phrase');
  if (options.phone) await userEvent.type(screen.getByLabelText(fr.identity.fields.phone, { exact: false }), options.phone);
  if (options.terms ?? true) await userEvent.click(screen.getByRole('checkbox'));
}

async function submit() {
  await userEvent.click(screen.getByRole('button', { name: fr.identity.signUp.submit }));
  await settle();
}

describe('SignUpPage', () => {
  it('has one heading, the fields, the terms links and a sign-in link', async () => {
    await renderPage(SignUpPage, { url: '/inscription' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: fr.identity.signUp.terms }).getAttribute('href')).toBe('/conditions');
    expect(screen.getByRole('link', { name: fr.identity.signUp.privacy }).getAttribute('href')).toBe('/confidentialite');
    expect(screen.getByRole('link', { name: fr.identity.signUp.signIn }).getAttribute('href')).toBe('/connexion');
    expect(screen.getByText('+216')).toBeTruthy();
  });

  it('marks every field and sends nothing when the form is invalid', async () => {
    const { store } = await renderPage(SignUpPage, { url: '/inscription' });
    await submit();
    expect(store.register).not.toHaveBeenCalled();
    expect(screen.getByText(fr.identity.errors.termsRequired)).toBeTruthy();
    expect(screen.getByRole('checkbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('refuses a short password', async () => {
    const { store } = await renderPage(SignUpPage, { url: '/inscription' });
    await userEvent.type(screen.getByLabelText(fr.identity.fields.password), 'short');
    await submit();
    expect(store.register).not.toHaveBeenCalled();
    expect(screen.getByText('8 caractères minimum.')).toBeTruthy();
  });

  it('registers with the UI language and the phone with +216, then goes to the email code', async () => {
    const { store, router } = await renderPage(SignUpPage, { url: '/inscription' });
    await fill({ phone: '20 123 456' });
    await submit();
    expect(store.register).toHaveBeenCalledWith(
      { name: 'Amira', email: 'amira@exemple.com', password: 'secret-phrase', locale: 'fr', phone: '+21620123456' },
      ['email.taken', 'request.throttled'],
    );
    expect(router.url).toBe('/inscription/code');
    expect(TestBed.inject(SignUpDraft).values()).toEqual({ name: 'Amira', email: 'amira@exemple.com', phone: '20 123 456', terms: true });
  });

  it('sends no phone when none is typed', async () => {
    const { store } = await renderPage(SignUpPage, { url: '/inscription' });
    await fill();
    await submit();
    expect(store.register.mock.calls[0][0]).not.toHaveProperty('phone');
  });

  it('shows a taken email on the field with a link to sign in', async () => {
    const store = fakeSessionStore();
    store.register.mockResolvedValue(failed('conflict', 409, 'email.taken'));
    await renderPage(SignUpPage, { url: '/inscription', store });
    await fill();
    await submit();
    expect(screen.getByText(fr.identity.errors.email.taken)).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.identity.signUp.signInInstead }).getAttribute('href')).toBe('/connexion');
  });

  it('puts server field codes on their fields', async () => {
    const store = fakeSessionStore();
    store.register.mockResolvedValue(failed('validation', 422, 'validation.failed', { password: ['password.min'], phone: ['phone.regex'] }));
    await renderPage(SignUpPage, { url: '/inscription', store });
    await fill({ phone: '20123456' });
    await submit();
    expect(screen.getByText(fr.identity.errors.password.min)).toBeTruthy();
    expect(screen.getByText(fr.identity.errors.fields.phone)).toBeTruthy();
  });

  it('fills the form again from the draft, without the password', async () => {
    await renderPage(SignUpPage, {
      url: '/inscription',
      beforeNavigate: () => TestBed.inject(SignUpDraft).values.set({ name: 'Amira', email: 'amira@exemple.com', phone: '', terms: true }),
    });
    expect((screen.getByLabelText(fr.identity.fields.email) as HTMLInputElement).value).toBe('amira@exemple.com');
    expect((screen.getByLabelText(fr.identity.fields.password) as HTMLInputElement).value).toBe('');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });
});
