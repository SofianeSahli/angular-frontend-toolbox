import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '@shared/stores';
import { AUTH_CONFIG, AuthConfig } from './auth.config';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';

// spec 001, REQ-5.6: every auth/profile request is built from the one apiBaseUrl.
const API = 'https://api.test/api/v1';

describe('auth and profile request URLs', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AUTH_CONFIG,
          useValue: {
            apiBaseUrl: API,
            homeRoute: '/dashboard',
            loginUrl: '/',
            loginEndpoint: '/auth/login',
            profileEndpoint: '/profile',
          } satisfies AuthConfig,
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login posts to apiBaseUrl + loginEndpoint', () => {
    TestBed.inject(AuthService).login('amel', 'secret').subscribe();
    http.expectOne({ method: 'POST', url: `${API}/auth/login` });
  });

  it('logout calls apiBaseUrl + /auth/logout by default', () => {
    TestBed.inject(AuthService).logout().subscribe();
    http.expectOne({ method: 'GET', url: `${API}/auth/logout` });
  });

  it('profile get uses apiBaseUrl + profileEndpoint', () => {
    TestBed.inject(ProfileService).get().subscribe();
    http.expectOne({ method: 'GET', url: `${API}/profile` });
  });

  it('profile getById keeps the id and uses apiBaseUrl', () => {
    TestBed.inject(ProfileService).getById('42').subscribe();
    http.expectOne({ method: 'GET', url: `${API}/profile/42` });
  });

  it('patchProfile updates email/phone then the profile, both on apiBaseUrl', () => {
    TestBed.inject(ProfileService)
      .patchProfile({ email: 'a@b.tn', phone_number: '20000000' } as User)
      .subscribe();
    http.expectOne({ method: 'POST', url: `${API}/auth/update-email-phone` }).flush({});
    http.expectOne({ method: 'POST', url: `${API}/profile` });
  });
});
