import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideUi } from './provide-ui';
import { UI_CONFIG } from './ui-theme';

const theme = { name: 'test', accents: ['olive', 'figue'], defaultAccent: 'olive' } as const;

async function init() {
  await TestBed.inject(ApplicationInitStatus).donePromise;
}

describe('provideUi (spec 002, REQ-1.5, REQ-5.7)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    ['data-theme', 'data-bs-theme', 'data-accent'].forEach((a) => document.documentElement.removeAttribute(a));
  });

  it('provides the config and applies the selected accent at startup', async () => {
    TestBed.configureTestingModule({ providers: [provideUi({ theme, accent: 'figue' })] });
    await init();
    expect(TestBed.inject(UI_CONFIG).theme).toBe(theme);
    expect(document.documentElement.getAttribute('data-accent')).toBe('figue');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it("uses the theme's default accent when none is given", async () => {
    TestBed.configureTestingModule({ providers: [provideUi({ theme })] });
    await init();
    expect(document.documentElement.getAttribute('data-accent')).toBe('olive');
  });

  it('refuses an accent the theme does not have', () => {
    expect(() => provideUi({ theme, accent: 'safran' as 'olive' })).toThrow('accent "safran" is not an accent of theme "test" (olive, figue)');
  });
});
