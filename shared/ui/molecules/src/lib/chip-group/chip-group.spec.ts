import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiChipGroup } from './chip-group';

const options = [
  { value: 'all', label: 'Tout' },
  { value: 'expenses', label: 'Dépenses', count: 24 },
  { value: 'income', label: 'Revenus', count: 1 },
];

const chip = (name: RegExp) => screen.getByRole('button', { name });
const isPressed = (name: RegExp) => chip(name).getAttribute('aria-pressed') === 'true';

describe('ui-chip-group', () => {
  it('selects one value in single mode, and clears it on a second press', async () => {
    const filter = new FormControl<unknown>('all');
    await render('<ui-chip-group [options]="options" ariaLabel="Type" [formControl]="filter" />', {
      imports: [UiChipGroup, ReactiveFormsModule],
      componentProperties: { filter, options },
    });
    expect(screen.getByRole('group', { name: 'Type' })).toBeTruthy();
    await userEvent.click(chip(/^Dépenses/));
    expect(filter.value).toBe('expenses');
    expect(isPressed(/^Dépenses/)).toBe(true);
    expect(isPressed(/^Tout/)).toBe(false);
    await userEvent.click(chip(/^Dépenses/));
    expect(filter.value).toBeNull();
  });

  it('never leaves zero selected in single mode when required', async () => {
    const filter = new FormControl<unknown>('all');
    await render('<ui-chip-group [options]="options" ariaLabel="Type" required [formControl]="filter" />', {
      imports: [UiChipGroup, ReactiveFormsModule],
      componentProperties: { filter, options },
    });
    await userEvent.click(chip(/^Tout/));
    expect(filter.value).toBe('all');
  });

  it('keeps an array in multiple mode', async () => {
    const filter = new FormControl<unknown>([]);
    await render('<ui-chip-group [options]="options" ariaLabel="Types" mode="multiple" [formControl]="filter" />', {
      imports: [UiChipGroup, ReactiveFormsModule],
      componentProperties: { filter, options },
    });
    await userEvent.click(chip(/^Dépenses/));
    await userEvent.click(chip(/^Revenus/));
    expect(filter.value).toEqual(['expenses', 'income']);
    await userEvent.click(chip(/^Dépenses/));
    expect(filter.value).toEqual(['income']);
  });

  it('is disabled with its form control', async () => {
    const filter = new FormControl<unknown>({ value: 'all', disabled: true });
    await render('<ui-chip-group [options]="options" ariaLabel="Type" [formControl]="filter" />', {
      imports: [UiChipGroup, ReactiveFormsModule],
      componentProperties: { filter, options },
    });
    expect(screen.getAllByRole('button').every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
  });
});
