import { CurrencyFormat, formatMinor } from '@shared/util-format';

export function wholeUnits(minor: number, exponent: number): number {
  return Math.floor(minor / 10 ** exponent);
}

export function formatWhole(minor: number, currency: CurrencyFormat): string {
  return formatMinor(wholeUnits(minor, currency.exponent) * 10 ** currency.exponent, currency, { display: 'rounded' });
}

export function perDayUnits(remaining: number | null, daysLeft: number | null, exponent: number): number | null {
  if (remaining === null || daysLeft === null || daysLeft <= 0 || remaining <= 0) return null;
  return wholeUnits(Math.floor(remaining / daysLeft), exponent);
}
