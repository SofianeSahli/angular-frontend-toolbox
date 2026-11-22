import { TestBed } from '@angular/core/testing';
import { UI_THEME_STORAGE_KEY } from './ui-theme';
import { UiThemeService } from './ui-theme.service';

type Listener = (event: MediaQueryListEvent) => void;

function fakeDevice(dark: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: dark,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn(() => mql) });
  return {
    listeners,
    change(nowDark: boolean) {
      mql.matches = nowDark;
      listeners.forEach((l) => l({ matches: nowDark } as MediaQueryListEvent));
    },
  };
}

const html = () => document.documentElement;

describe('UiThemeService (spec 002, US-5)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
    ['data-theme', 'data-bs-theme', 'data-accent'].forEach((a) => html().removeAttribute(a));
  });

  it('defaults to "system" and follows a light device (REQ-5.2, REQ-5.3)', () => {
    fakeDevice(false);
    const service = TestBed.inject(UiThemeService);
    expect(service.choice()).toBe('system');
    expect(service.active()).toBe('light');
    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it('applies dark on <html> for a dark device, including Bootstrap\'s attribute (REQ-5.1, REQ-4.3)', () => {
    fakeDevice(true);
    TestBed.inject(UiThemeService);
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(html().getAttribute('data-bs-theme')).toBe('dark');
  });

  it('follows the device live while the choice is "system", and not after an explicit choice (REQ-5.3)', () => {
    const device = fakeDevice(false);
    const service = TestBed.inject(UiThemeService);
    device.change(true);
    expect(service.active()).toBe('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');

    service.setChoice('light');
    device.change(true);
    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it('applies a choice immediately and remembers it under ui.theme (REQ-5.4)', () => {
    fakeDevice(false);
    TestBed.inject(UiThemeService).setChoice('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(UI_THEME_STORAGE_KEY)).toBe('dark');

    TestBed.resetTestingModule();
    html().removeAttribute('data-theme');
    const next = TestBed.inject(UiThemeService);
    expect(next.choice()).toBe('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  it('does not read the old "theme" key, and ignores an invalid saved value (REQ-5.5)', () => {
    fakeDevice(false);
    localStorage.setItem('theme', 'dark');
    expect(TestBed.inject(UiThemeService).choice()).toBe('system');

    TestBed.resetTestingModule();
    localStorage.setItem(UI_THEME_STORAGE_KEY, 'sepia');
    expect(TestBed.inject(UiThemeService).choice()).toBe('system');
  });

  it('still applies and switches the theme when storage throws (REQ-5.6)', () => {
    fakeDevice(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const service = TestBed.inject(UiThemeService);
    expect(service.choice()).toBe('system');
    expect(() => service.setChoice('dark')).not.toThrow();
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  it('falls back to light when the browser has no matchMedia', () => {
    expect(TestBed.inject(UiThemeService).active()).toBe('light');
  });

  it('refuses an unknown choice', () => {
    fakeDevice(false);
    const service = TestBed.inject(UiThemeService);
    expect(() => service.setChoice('sepia' as never)).toThrow('Unknown theme choice "sepia"');
  });

  it('stops listening to the device when the injector is destroyed', () => {
    const device = fakeDevice(false);
    TestBed.inject(UiThemeService);
    expect(device.listeners.size).toBe(1);
    TestBed.resetTestingModule();
    expect(device.listeners.size).toBe(0);
  });
});
