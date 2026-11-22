import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgZone, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ToastService } from '@shared/ui-components';
import { AUTH_CONFIG, AuthConfig } from '../services/auth.config';
import { RequestResetPassword } from './reset-password/request-reset-password/request-reset-password';
import { ResetPassword } from './reset-password/reset-password/reset-password';
import { UpdatePasswordFormComponent } from './security-settings/update-password-form/update-password-form.component';

// spec 001 T13 (REQ-3.5c): pages that show the result of an HTTP call must
// keep doing so after switching to OnPush. Written before the switch.
// HTTP responses are flushed inside NgZone, as they arrive in the app.
const API = 'https://api.test/api/v1';
// Known issue (spec 005): updatePassword/resetPassword build their URL with a
// line break and spaces inside the template literal, so match on the trimmed URL.
const updatePasswordUrl = (r: { url: string }) => r.url.trim() === `${API}/update-password`;

describe('auth pages with HTTP results', () => {
  let http: HttpTestingController;
  let zone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        provideNoopAnimations(),
        {
          provide: AUTH_CONFIG,
          useValue: { apiBaseUrl: API, homeRoute: '/dashboard', loginUrl: '/' } satisfies AuthConfig,
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
  });

  afterEach(() => http.verify());

  async function render<T>(component: Type<T>): Promise<ComponentFixture<T>> {
    const fixture = TestBed.createComponent(component);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
  }

  /** Types into an input and leaves it, as a user does. */
  function type(fixture: ComponentFixture<unknown>, selector: string, value: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  const spinner = (fixture: ComponentFixture<unknown>) =>
    fixture.nativeElement.querySelector('.spinner-border');

  describe('UpdatePasswordFormComponent', () => {
    async function submitValidForm() {
      const fixture = await render(UpdatePasswordFormComponent);
      type(fixture, 'input#current_password', 'old-secret');
      type(fixture, 'input#password', 'new-secret');
      type(fixture, 'input#password_confirmation', 'new-secret');
      await fixture.whenStable();
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      return fixture;
    }

    it('shows the spinner while saving and hides it after a success', async () => {
      const fixture = await submitValidForm();
      expect(spinner(fixture)).not.toBeNull();

      zone.run(() => http.expectOne(updatePasswordUrl).flush({}));
      await fixture.whenStable();
      expect(spinner(fixture)).toBeNull();
      expect(fixture.componentInstance.form.pristine).toBe(true);
    });

    it('hides the spinner after an error', async () => {
      const fixture = await submitValidForm();
      expect(spinner(fixture)).not.toBeNull();

      zone.run(() =>
        http.expectOne(updatePasswordUrl).flush('nope', { status: 422, statusText: 'Unprocessable' })
      );
      await fixture.whenStable();
      expect(spinner(fixture)).toBeNull();
    });
  });

  describe('ResetPassword', () => {
    it('shows the spinner on submit and a toast with the result', async () => {
      TestBed.inject(Router).navigateByUrl = vi.fn().mockResolvedValue(true);
      const fixture = await render(ResetPassword);
      fixture.componentInstance.token = 'reset-token';
      type(fixture, 'input#password', 'new-secret');
      type(fixture, 'input#password_confirmation', 'new-secret');
      await fixture.whenStable();
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      expect(spinner(fixture)).not.toBeNull();

      zone.run(() => http.expectOne((r) => r.url.startsWith(`${API}/auth/reset-password/`)).flush({}));
      // Checked right away: toasts dismiss themselves after 4 s, which whenStable() would wait for.
      expect(TestBed.inject(ToastService).toasts().map((t) => t.message)).toContain('labels.password_changed');
    });
  });

  describe('RequestResetPassword', () => {
    it('warns with a toast when submitted empty', async () => {
      const fixture = await render(RequestResetPassword);
      fixture.nativeElement.querySelector('button.btn-primary').click();
      // Checked right away: toasts dismiss themselves after 4 s, which whenStable() would wait for.
      expect(TestBed.inject(ToastService).toasts().map((t) => t.message)).toContain('errors.input_enpty');
    });

    it('sends the request for the typed account and leaves the page on success', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const fixture = await render(RequestResetPassword);
      type(fixture, 'input', 'amel');
      fixture.nativeElement.querySelector('button.btn-primary').click();
      await fixture.whenStable();

      zone.run(() => http.expectOne((r) => r.url.includes('/auth/send-reset-password-mail/amel')).flush({}));
      await fixture.whenStable();
      expect(navigate).toHaveBeenCalledWith(['']);
    });
  });
});
