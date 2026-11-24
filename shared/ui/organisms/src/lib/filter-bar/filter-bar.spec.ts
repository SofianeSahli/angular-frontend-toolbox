import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { UiFilterBar } from './filter-bar';

@Component({
  selector: 'ui-search-field',
  template: '<input type="search" aria-label="Rechercher" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FakeSearchField {}

describe('ui-filter-bar', () => {
  it('is a search landmark that puts the search field first, then the filters and the reset action', async () => {
    const { container } = await render(
      `<ui-filter-bar>
         <select aria-label="Catégorie"><option>Toutes</option></select>
         <button uiFilterReset>Réinitialiser</button>
         <ui-search-field />
       </ui-filter-bar>`,
      { imports: [UiFilterBar, FakeSearchField] },
    );
    const bar = screen.getByRole('search');
    const order = Array.from(container.querySelectorAll('ui-search-field, select, button')).map((element) => element.tagName);
    expect(order).toEqual(['UI-SEARCH-FIELD', 'SELECT', 'BUTTON']);
    expect(bar.querySelector('.ui-filter-bar__reset button')?.textContent).toBe('Réinitialiser');
  });
});
