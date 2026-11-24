import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import ar from '../../../public/i18n/ar.json';
import en from '../../../public/i18n/en.json';
import fr from '../../../public/i18n/fr.json';
import { LANGUAGE_STORAGE_KEY, LanguageService } from '../i18n/language.service';
import { AuthFrame } from './auth-frame';

async function renderFrame() {
  localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  const view = await render(AuthFrame, {
    providers: [provideRouter([]), provideTranslateService({ lang: 'fr' }), { provide: SessionStore, useValue: { account: signal(null) } }],
  });
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('fr', fr);
  translate.setTranslation('en', en);
  translate.setTranslation('ar', ar);
  view.detectChanges();
  return view;
}

describe('AuthFrame', () => {
  afterEach(() => localStorage.clear());

  it('shows the Olivier brand panel with the promise, three benefits and the note', async () => {
    await renderFrame();
    expect(screen.getByText('Olivier')).toBeTruthy();
    expect(screen.getByText(fr.brand.promise)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(fr.brand.note)).toBeTruthy();
  });

  it('offers FR, EN and ع, and switching to ع turns the page right-to-left in Arabic', async () => {
    const view = await renderFrame();
    const switcher = screen.getByRole('radiogroup', { name: fr.language.label });
    expect(Array.from(switcher.querySelectorAll('[role=radio]')).map((option) => option.textContent?.trim())).toEqual(['FR', 'EN', 'ع']);
    expect(screen.getByRole('radio', { name: 'FR' }).getAttribute('aria-checked')).toBe('true');

    await userEvent.click(screen.getByRole('radio', { name: 'ع' }));
    view.detectChanges();
    expect(TestBed.inject(LanguageService).language()).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByText(ar.brand.promise)).toBeTruthy();
    expect(screen.getByText('Olivier').getAttribute('dir')).toBe('ltr');
  });

  it('has every French key in the English and Arabic app translations', () => {
    const keysOf = (value: object, prefix = ''): string[] =>
      Object.entries(value).flatMap(([key, child]) => (typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`]));
    expect(keysOf(en).sort()).toEqual(keysOf(fr).sort());
    expect(keysOf(ar).sort()).toEqual(keysOf(fr).sort());
  });
});
