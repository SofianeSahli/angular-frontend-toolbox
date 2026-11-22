import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import fr from '../../../public/i18n/fr.json';
import { Home } from './home';

describe('Home (spec 002, REQ-8.4)', () => {
  it('renders the app name and its line of text from fr.json', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ fallbackLang: 'fr', lang: 'fr' })] });
    TestBed.inject(TranslateService).setTranslation('fr', fr);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe(fr.app.name);
    expect(el.querySelector('p')?.textContent?.trim()).toBe(fr.home.text);
  });
});
