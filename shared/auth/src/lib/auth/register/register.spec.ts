import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AUTH_CONFIG } from '../../services/auth.config';
import { Register } from './register';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: AUTH_CONFIG, useValue: { apiBaseUrl: '/api', homeRoute: '/dashboard', loginUrl: '/' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
  });

  it('renders the registration form', () => {
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });
});
