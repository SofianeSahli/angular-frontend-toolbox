import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiBarItem, UiBarList } from './bar-list';

const items: UiBarItem[] = [
  { id: 'food', label: 'Alimentation', value: 400, valueText: '400 DT', shareText: '40 %', clickable: true },
  { id: 'home', label: 'Maison', value: 200, valueText: '200 DT', shareText: '20 %', clickable: true },
  { id: 'others', label: 'Autres catégories', value: 100, valueText: '100 DT' },
];

function bars(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.ui-bar-list__bar')).map((bar) => bar.style.inlineSize);
}

describe('ui-bar-list (spec 008 REQ-7.2)', () => {
  it('keeps the given order and scales bars to the largest value', async () => {
    await render(UiBarList, { inputs: { items } });
    expect(screen.getAllByRole('listitem').map((row) => row.querySelector('.ui-bar-list__label')?.textContent)).toEqual([
      'Alimentation',
      'Maison',
      'Autres catégories',
    ]);
    expect(bars()).toEqual(['100%', '50%', '25%']);
  });

  it('shows the value and share texts', async () => {
    await render(UiBarList, { inputs: { items } });
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('400 DT');
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('40 %');
  });

  it('makes clickable rows buttons that emit itemSelect', async () => {
    const itemSelect = vi.fn();
    await render(UiBarList, { inputs: { items }, on: { itemSelect } });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Maison/ }));
    expect(itemSelect).toHaveBeenCalledWith('home');
  });

  it('shows the empty text when there is no item', async () => {
    await render(UiBarList, { inputs: { items: [], emptyText: 'Aucune dépense' } });
    expect(screen.getByText('Aucune dépense')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('draws empty bars when every value is 0', async () => {
    await render(UiBarList, { inputs: { items: [{ id: 'a', label: 'A', value: 0, valueText: '0 DT' }] } });
    expect(bars()).toEqual(['0%']);
  });
});
