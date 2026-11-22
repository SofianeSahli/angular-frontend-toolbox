import { Component, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppNavbar } from './app-navbar';

@Component({ template: '' })
class EmptyPage {}

describe('AppNavbar', () => {
  let fixture: ComponentFixture<AppNavbar>;
  const highlighted = (url: string): boolean =>
    (fixture.nativeElement.querySelector(`a.nav-link[href="${url}"]`) as HTMLElement).classList.contains('btn-primary');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavbar],
      providers: [
        provideRouter([
          { path: 'dashboard', component: EmptyPage },
          { path: 'dashboard/lists', component: EmptyPage },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavbar);
    fixture.componentRef.setInput('user', { first_name: 'Amel', last_name: 'Ben Ali' });
    fixture.componentRef.setInput('routes', [
      { label: 'routings.summary', url: '/dashboard', icon: 'bi bi-bar-chart' },
      { label: 'routings.listes', url: '/dashboard/lists', icon: 'bi bi-list-ul' },
    ]);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  // spec 001 T15 (REQ-3.5c): the highlighted link must follow navigation,
  // which completes after the click's change-detection pass.
  it('highlights the link of the current page after each navigation', async () => {
    const zone = TestBed.inject(NgZone);
    const router = TestBed.inject(Router);

    await zone.run(() => router.navigateByUrl('/dashboard'));
    await fixture.whenStable();
    expect(highlighted('/dashboard')).toBe(true);
    expect(highlighted('/dashboard/lists')).toBe(false);

    await zone.run(() => router.navigateByUrl('/dashboard/lists'));
    await fixture.whenStable();
    expect(highlighted('/dashboard/lists')).toBe(true);
    expect(highlighted('/dashboard')).toBe(false);
  });
});
