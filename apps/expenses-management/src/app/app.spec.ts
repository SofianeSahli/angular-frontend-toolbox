import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';

describe('App', () => {
  it('renders the router outlet and one error presenter for every page', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService({ lang: 'fr' })] });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('router-outlet')).toHaveLength(1);
    expect(root.querySelectorAll('shared-error-presenter')).toHaveLength(1);
  });
});
