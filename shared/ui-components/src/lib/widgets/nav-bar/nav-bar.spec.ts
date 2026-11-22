import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../utils/display-mode.service';
import { NavBar } from './nav-bar';

describe('NavBar', () => {
  let fixture: ComponentFixture<NavBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [provideRouter([]), provideTranslateService(), provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(NavBar);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('toggles the theme from the keyboard as well as the mouse', () => {
    const toggle = vi.spyOn(TestBed.inject(ThemeService), 'toggleTheme');
    const button: HTMLElement = fixture.nativeElement.querySelector('.main-navbar-dark-light');

    button.click();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(toggle).toHaveBeenCalledTimes(2);
  });
});
