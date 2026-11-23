import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiSearchField } from './search-field';

async function setup() {
  const query = signal('');
  const result = await render('<ui-search-field [(value)]="query" ariaLabel="Rechercher" placeholder="ex. Carrefour" [debounce]="250" />', {
    imports: [UiSearchField],
    componentProperties: { query },
  });
  return { query, ...result };
}

describe('ui-search-field', () => {
  afterEach(() => vi.useRealTimers());

  it('is a named search box', async () => {
    await setup();
    expect(screen.getByRole('searchbox', { name: 'Rechercher' }).getAttribute('placeholder')).toBe('ex. Carrefour');
  });

  it('writes the value only once the debounce delay has passed since the last keystroke', async () => {
    vi.useFakeTimers();
    const { query } = await setup();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByRole('searchbox'), 'car');
    expect(query()).toBe('');
    vi.advanceTimersByTime(249);
    expect(query()).toBe('');
    vi.advanceTimersByTime(1);
    expect(query()).toBe('car');
  });

  it('clears at once with Escape, and with the clear button, keeping focus in the field', async () => {
    const { query, fixture } = await setup();
    const box = screen.getByRole('searchbox');
    await userEvent.type(box, 'loyer');
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(query()).toBe('');
    expect((box as HTMLInputElement).value).toBe('');
    expect(document.activeElement).toBe(box);
    await userEvent.type(box, 'eau');
    await userEvent.keyboard('{Escape}');
    expect(query()).toBe('');
    expect(document.activeElement).toBe(box);
  });

  it('shows the clear button only when there is text', async () => {
    await setup();
    expect(screen.queryByRole('button', { name: 'Effacer' })).toBeNull();
  });
});
