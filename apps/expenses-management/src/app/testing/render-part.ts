import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import fr from '../../../public/i18n/fr.json';
import { CategoryLabels } from '../categories/data/category-labels';

export const TND = { code: 'TND', exponent: 3 } as const;

export const FAKE_LABELS = { name: (code: string) => `Nom ${code}`, emoji: () => '🙂', path: (code: string) => `Nom ${code}` };

export async function renderPart<T>(component: Type<T>, inputs: Record<string, unknown>, on: Record<string, (value: never) => void> = {}) {
  const view = await render(component, {
    inputs: inputs as never,
    on: on as never,
    providers: [provideRouter([]), provideTranslateService({ lang: 'fr' }), { provide: CategoryLabels, useValue: FAKE_LABELS }],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return view;
}

export function visibleText(): string {
  return (document.body.textContent ?? '').replace(/[ \t\n\r]+/g, ' ');
}
