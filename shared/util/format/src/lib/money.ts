export interface CurrencyFormat {
  readonly code: string;
  readonly exponent: number;
}

export interface FormatMinorOptions {
  readonly display?: 'full' | 'rounded';
  readonly signed?: boolean;
}

export type ParseFailure = 'empty' | 'invalid' | 'too_many_decimals' | 'zero' | 'too_large';
export type ParseResult = { readonly ok: true; readonly minor: number } | { readonly ok: false; readonly reason: ParseFailure };

export const TND: CurrencyFormat = { code: 'TND', exponent: 3 };
export const MAX_MINOR = 999_999_999_999;

const LOCALE = 'fr-TN';
const MAX_MINOR_DIGITS = String(MAX_MINOR).length;
const MAJOR_TEXT = /^(\d*)(?:[.,](\d*))?$/;
const SPACES = /\s/g;

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: CurrencyFormat, rounded: boolean, signed: boolean): Intl.NumberFormat {
  const key = `${currency.code}|${currency.exponent}|${rounded}|${signed}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const digits = rounded ? 0 : currency.exponent;
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      ...(signed ? { signDisplay: 'exceptZero' as const } : {}),
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function assertMinor(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected an integer number of minor units, got ${String(value)}`);
  }
}

export function formatMinor(value: number, currency: CurrencyFormat, options: FormatMinorOptions = {}): string {
  assertMinor(value);
  return formatterFor(currency, options.display === 'rounded', options.signed === true).format(value / 10 ** currency.exponent);
}

export interface ParseMajorOptions {
  readonly allowZero?: boolean;
}

export function parseMajor(text: string, exponent: number, options: ParseMajorOptions = {}): ParseResult {
  const compact = text.replace(SPACES, '');
  if (compact === '') return { ok: false, reason: 'empty' };
  const match = MAJOR_TEXT.exec(compact);
  const whole = match?.[1] ?? '';
  const fraction = match?.[2] ?? '';
  if (!match || whole + fraction === '') return { ok: false, reason: 'invalid' };
  if (fraction.length > exponent) return { ok: false, reason: 'too_many_decimals' };
  const digits = (whole + fraction.padEnd(exponent, '0')).replace(/^0+/, '');
  if (digits === '') return options.allowZero ? { ok: true, minor: 0 } : { ok: false, reason: 'zero' };
  if (digits.length > MAX_MINOR_DIGITS || Number(digits) > MAX_MINOR) return { ok: false, reason: 'too_large' };
  return { ok: true, minor: Number(digits) };
}

export function assertMillimes(value: number): void {
  assertMinor(value);
}

export function formatMillimes(value: number): string {
  return formatMinor(value, TND);
}

export function formatMillimesHeadline(value: number): string {
  return formatMinor(value, TND, { display: 'rounded' });
}

export function formatSignedMillimes(value: number): string {
  return formatMinor(value, TND, { signed: true });
}

export function formatSignedMillimesHeadline(value: number): string {
  return formatMinor(value, TND, { display: 'rounded', signed: true });
}
