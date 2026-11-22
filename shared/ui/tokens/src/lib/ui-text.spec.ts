import { TestBed } from '@angular/core/testing';
import { DEFAULT_UI_TEXT, UI_TEXT, provideUiText } from './ui-text';

describe('UI_TEXT', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('defaults to the French built-in strings', () => {
    expect(TestBed.inject(UI_TEXT)).toEqual({ loading: 'Chargement', optional: '(facultatif)' });
  });

  it('lets an app override some strings and keeps the others', () => {
    TestBed.configureTestingModule({ providers: [provideUiText({ loading: 'Loading' })] });
    expect(TestBed.inject(UI_TEXT)).toEqual({ ...DEFAULT_UI_TEXT, loading: 'Loading' });
  });
});
