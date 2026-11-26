import { signal } from '@angular/core';
import { TND } from '@shared/util-format';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AmountPad, typedAmount } from './amount-pad';

describe('AmountPad (spec 009 REQ-3.1, 3.2)', () => {
  it('groups the whole part as typed and keeps the typed decimals', () => {
    expect(typedAmount('')).toBe('0');
    expect(typedAmount('1234567')).toBe('1\u202f234\u202f567');
    expect(typedAmount('12,5')).toBe('12,5');
    expect(typedAmount('1000,')).toBe('1\u202f000,');
  });

  it('shows the amount with the currency and edits it with the keypad or the keyboard', async () => {
    const value = signal('');
    const currency = TND;
    await render('<app-amount-pad [(value)]="value" [currency]="currency" label="Montant" inputId="entry-amount" />', {
      imports: [AmountPad],
      componentProperties: { value, currency },
    });
    const output = screen.getByLabelText('Montant');
    expect(output.id).toBe('entry-amount');
    expect(output.textContent).toContain('TND');
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(value()).toBe('12');
    output.focus();
    await userEvent.keyboard(',5');
    expect(value()).toBe('12,5');
    screen.getByRole('button', { name: '3' }).focus();
    await userEvent.keyboard('7');
    expect(value()).toBe('12,57');
  });
});
