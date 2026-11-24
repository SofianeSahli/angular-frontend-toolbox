import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import fr from '../../../public/i18n/fr.json';
import { Home } from './home';

describe('Home', () => {
  it('shows the page title and welcomes the signed-in user by name', () => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'fr', lang: 'fr' }), { provide: SessionStore, useValue: { account: signal({ name: 'Amira' }) } }],
    });
    TestBed.inject(TranslateService).setTranslation('fr', fr);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(fr.home.title);
    expect(element.querySelector('p')?.textContent?.trim()).toBe('Bienvenue Amira. Votre carnet arrive bientôt.');
  });
});
