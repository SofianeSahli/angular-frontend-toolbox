import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AUTH_CONFIG } from '../../../services/auth.config';
import { UpdatePasswordFormComponent } from './update-password-form.component';

describe('UpdatePasswordFormComponent', () => {
  let fixture: ComponentFixture<UpdatePasswordFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePasswordFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: AUTH_CONFIG, useValue: { apiBaseUrl: '/api', homeRoute: '/dashboard', loginUrl: '/' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdatePasswordFormComponent);
    fixture.detectChanges();
  });

  it('starts with an invalid, empty form', () => {
    expect(fixture.componentInstance.form.valid).toBe(false);
  });
});
