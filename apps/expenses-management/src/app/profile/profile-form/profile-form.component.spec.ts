import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AUTH_CONFIG } from '@shared/auth';
import { ProfileFormComponent } from './profile-form.component';

describe('ProfileFormComponent', () => {
  let fixture: ComponentFixture<ProfileFormComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfileFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: AUTH_CONFIG, useValue: { apiBaseUrl: '/api', homeRoute: '/dashboard', loginUrl: '/' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileFormComponent);
    fixture.detectChanges();
  });

  it('starts with an empty, invalid profile form', () => {
    expect(fixture.componentInstance.profileForm.valid).toBe(false);
  });
});
