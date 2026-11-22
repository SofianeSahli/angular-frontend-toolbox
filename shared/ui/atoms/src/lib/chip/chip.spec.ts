import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiChip } from './chip';

describe('uiChip', () => {
  it('reports its pressed state and toggles from the page', async () => {
    const pressed = signal(false);
    const { fixture } = await render('<button uiChip [pressed]="pressed()" (click)="pressed.set(!pressed())">Dépenses</button>', {
      imports: [UiChip],
      componentProperties: { pressed },
    });
    const chip = screen.getByRole('button', { name: 'Dépenses' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(chip);
    fixture.detectChanges();
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    chip.focus();
    await userEvent.keyboard(' ');
    fixture.detectChanges();
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows a count as part of its name', async () => {
    await render('<button uiChip [count]="24">Dépenses</button>', { imports: [UiChip] });
    expect(screen.getByRole('button', { name: 'Dépenses 24' })).toBeTruthy();
  });

  it('can be disabled', async () => {
    await render('<button uiChip disabled>Archivé</button>', { imports: [UiChip] });
    expect(screen.getByRole('button', { name: 'Archivé' })).toHaveProperty('disabled', true);
  });
});
