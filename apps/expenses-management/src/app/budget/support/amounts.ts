import { CurrencyFormat, FormatMinorOptions, formatMinor } from '@shared/util-format';

const UNIT = /\xa0([^\xa0\d]+)$/;

export function withoutUnit(minor: number, currency: CurrencyFormat, options: FormatMinorOptions = {}): string {
  return formatMinor(minor, currency, options).replace(UNIT, '');
}

export function unitOf(currency: CurrencyFormat): string {
  return UNIT.exec(formatMinor(0, currency))?.[1] ?? currency.code;
}
