import { signal } from '@angular/core';
import { UiListItem } from '@shared/ui-molecules';
import { render, screen, within } from '@testing-library/angular';
import { UiGroupedList } from './grouped-list';

type Intersect = (entries: { isIntersecting: boolean }[]) => void;
let intersect: Intersect = () => undefined;

class FakeIntersectionObserver {
  constructor(callback: Intersect) {
    intersect = callback;
  }
  observe(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

const groups = [
  { key: '2026-11-22', label: 'Dimanche 22 novembre', total: '-61,850 DT', items: ['Carrefour Market', 'Pharmacie'] },
  { key: '2026-11-21', label: 'Samedi 21 novembre', items: ['Loyer'] },
];

async function setup(initialGroups: typeof groups, loading = false) {
  const endReached = vi.fn();
  const isLoading = signal(loading);
  const result = await render(
    `<ui-grouped-list [groups]="groups" [itemTemplate]="row" [loading]="isLoading()" [empty]="nothing" (endReached)="endReached()" />
     <ng-template #row let-label><li uiListItem><span uiTitle>{{ label }}</span></li></ng-template>
     <ng-template #nothing><p>Aucune opération ce mois-ci.</p></ng-template>`,
    { imports: [UiGroupedList, UiListItem], componentProperties: { groups: initialGroups, endReached, isLoading } },
  );
  return { endReached, isLoading, ...result };
}

describe('ui-grouped-list', () => {
  beforeEach(() => Object.defineProperty(window, 'IntersectionObserver', { configurable: true, writable: true, value: FakeIntersectionObserver }));
  afterEach(() => Reflect.deleteProperty(window, 'IntersectionObserver'));

  it('renders each group as a section named by its header, with its total and rows', async () => {
    await setup(groups);
    const day = screen.getByRole('region', { name: 'Dimanche 22 novembre -61,850 DT' });
    expect(within(day).getAllByRole('listitem').map((row) => row.textContent?.trim())).toEqual(['Carrefour Market', 'Pharmacie']);
    expect(screen.getByRole('region', { name: 'Samedi 21 novembre' })).toBeTruthy();
  });

  it('shows skeleton rows while loading, hidden from assistive technology', async () => {
    const { container } = await setup(groups, true);
    const loading = container.querySelector('.ui-grouped-list__loading');
    expect(loading?.getAttribute('aria-hidden')).toBe('true');
    expect(loading?.querySelectorAll('ui-skeleton')).toHaveLength(3);
  });

  it('shows the empty template when there are no groups and it is not loading', async () => {
    await setup([]);
    expect(screen.getByText('Aucune opération ce mois-ci.')).toBeTruthy();
  });

  it('emits endReached once per arrival at the end, and not while loading', async () => {
    const { endReached, isLoading, fixture } = await setup(groups);
    intersect([{ isIntersecting: true }]);
    expect(endReached).toHaveBeenCalledTimes(1);
    intersect([{ isIntersecting: false }]);
    expect(endReached).toHaveBeenCalledTimes(1);
    isLoading.set(true);
    fixture.detectChanges();
    intersect([{ isIntersecting: true }]);
    expect(endReached).toHaveBeenCalledTimes(1);
  });
});
