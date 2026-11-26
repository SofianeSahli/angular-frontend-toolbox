import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiAmountKeypad, UiKeypadOptions, pressKeypadKey } from './amount-keypad';

const TND: UiKeypadOptions = { decimals: 3, separator: ',', maxDigits: 6 };

function typed(keys: string, options: UiKeypadOptions = TND): string {
  return [...keys].reduce((text, key) => pressKeypadKey(text, key === ',' ? 'separator' : key === '<' ? 'delete' : (key as never), options), '');
}

describe('pressKeypadKey', () => {
  it('appends digits and replaces a lone zero', () => {
    expect(typed('12')).toBe('12');
    expect(typed('05')).toBe('5');
    expect(typed('00')).toBe('0');
  });

  it('starts a decimal part with 0 and accepts one separator only', () => {
    expect(typed(',5')).toBe('0,5');
    expect(typed('1,,2')).toBe('1,2');
  });

  it('stops at the currency exponent and at the digit limit', () => {
    expect(typed('1,2345')).toBe('1,234');
    expect(typed('1234567')).toBe('123456');
    expect(typed('1,5', { decimals: 0, separator: ',', maxDigits: 9 })).toBe('15');
  });

  it('deletes the last character', () => {
    expect(typed('12,5<')).toBe('12,');
    expect(typed('<')).toBe('');
  });
});

async function setup(decimals = 3) {
  const value = signal('');
  const view = await render('<ui-amount-keypad [(value)]="value" [decimals]="decimals" />', {
    imports: [UiAmountKeypad],
    componentProperties: { value, decimals },
  });
  return { value, view };
}

describe('ui-amount-keypad', () => {
  it('is a named group of keys in 1–9, separator, 0, delete order', async () => {
    await setup();
    const group = screen.getByRole('group', { name: 'Pavé numérique' });
    const names = [...group.querySelectorAll('button')].map((key) => key.getAttribute('aria-label') ?? key.textContent?.trim());
    expect(names).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Virgule', '0', 'Effacer le dernier chiffre']);
    expect(group.getAttribute('dir')).toBe('ltr');
  });

  it('edits the bound text with the keys', async () => {
    const { value } = await setup();
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Virgule' }));
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(value()).toBe('4,5');
    await userEvent.click(screen.getByRole('button', { name: 'Effacer le dernier chiffre' }));
    expect(value()).toBe('4,');
  });

  it('accepts digits, the separator and Backspace from a keyboard while focused', async () => {
    const { value } = await setup();
    screen.getByRole('button', { name: '1' }).focus();
    await userEvent.keyboard('12.5{Backspace}7');
    expect(value()).toBe('12,7');
  });

  it('disables the separator when the currency has no decimals', async () => {
    const { value } = await setup(0);
    expect((screen.getByRole('button', { name: 'Virgule' }) as HTMLButtonElement).disabled).toBe(true);
    screen.getByRole('button', { name: '1' }).focus();
    await userEvent.keyboard('3,4');
    expect(value()).toBe('34');
  });
});
