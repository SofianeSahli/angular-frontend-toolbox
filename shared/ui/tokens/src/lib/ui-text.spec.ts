import { TestBed } from '@angular/core/testing';
import { DEFAULT_UI_TEXT, UI_TEXT, fillUiText, provideUiText } from './ui-text';

describe('UI_TEXT', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('defaults to the French built-in strings', () => {
    const text = TestBed.inject(UI_TEXT);
    expect(text.loading).toBe('Chargement');
    expect(text.close).toBe('Fermer');
    expect(text.step).toBe('Étape {{current}} sur {{total}}');
    expect(text.errors.required).toBe('Ce champ est obligatoire.');
  });

  it('lets an app override some strings and keeps the others', () => {
    TestBed.configureTestingModule({ providers: [provideUiText({ loading: 'Loading' })] });
    expect(TestBed.inject(UI_TEXT)).toEqual({ ...DEFAULT_UI_TEXT, loading: 'Loading' });
  });

  it('merges error overrides with the default errors, and accepts new error keys', () => {
    TestBed.configureTestingModule({ providers: [provideUiText({ errors: { email: 'Bad e-mail.', millimes: 'Montant invalide.' } })] });
    const errors = TestBed.inject(UI_TEXT).errors;
    expect(errors.email).toBe('Bad e-mail.');
    expect(errors.required).toBe('Ce champ est obligatoire.');
    expect(errors['millimes']).toBe('Montant invalide.');
  });
});

describe('fillUiText', () => {
  it('fills named placeholders, with or without spaces', () => {
    expect(fillUiText('Étape {{current}} sur {{ total }}', { current: 1, total: 2 })).toBe('Étape 1 sur 2');
  });

  it('leaves unknown placeholders as they are', () => {
    expect(fillUiText('{{requiredLength}} caractères minimum.', {})).toBe('{{requiredLength}} caractères minimum.');
  });
});
