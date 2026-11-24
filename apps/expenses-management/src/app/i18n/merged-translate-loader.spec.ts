import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MergedTranslateLoader } from './merged-translate-loader';

describe('MergedTranslateLoader', () => {
  it('merges the app, identity and error translations of a language', async () => {
    TestBed.configureTestingModule({ providers: [MergedTranslateLoader, provideHttpClient(), provideHttpClientTesting()] });
    const backend = TestBed.inject(HttpTestingController);
    const loading = firstValueFrom(TestBed.inject(MergedTranslateLoader).getTranslation('ar'));

    backend.expectOne('/i18n/ar.json').flush({ app: { name: 'تطبيق' }, ui: { close: 'إغلاق' } });
    backend.expectOne('/i18n/identity/ar.json').flush({ identity: { signIn: { title: 'دخول' } } });
    backend.expectOne('/i18n/errors/ar.json').error(new ProgressEvent('error'), { status: 404 });

    expect(await loading).toEqual({ app: { name: 'تطبيق' }, ui: { close: 'إغلاق' }, identity: { signIn: { title: 'دخول' } } });
    backend.verify();
  });
});
