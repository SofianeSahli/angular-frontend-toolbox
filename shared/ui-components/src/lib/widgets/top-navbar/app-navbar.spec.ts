import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppNavbar } from './app-navbar';

describe('AppNavbar', () => {
  let fixture: ComponentFixture<AppNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavbar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavbar);
    fixture.componentRef.setInput('user', { first_name: 'Amel', last_name: 'Ben Ali' });
    fixture.componentRef.setInput('routes', [
      { label: 'routings.summary', url: '/dashboard', icon: 'bi bi-bar-chart' },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
