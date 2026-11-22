// Money formatting (spec 002, REQ-6.1 – REQ-6.5). Amounts are integer millimes (1 DT = 1000 millimes).
// No Angular dependency.

const MILLIMES_PER_DINAR = 1000;

const exact = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const signed = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
  signDisplay: 'exceptZero',
});

const headline = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Throws unless the value is a safe integer number of millimes (REQ-6.5): never rounds silently. */
export function assertMillimes(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected an integer number of millimes, got ${String(value)}`);
  }
}

/** `1234500` → `1 234,500 DT` (REQ-6.2). */
export function formatMillimes(value: number): string {
  assertMillimes(value);
  return exact.format(value / MILLIMES_PER_DINAR);
}

/** Rounded to whole dinars, half away from zero: `1234500` → `1 235 DT` (REQ-6.3). */
export function formatMillimesHeadline(value: number): string {
  assertMillimes(value);
  return headline.format(value / MILLIMES_PER_DINAR);
}

/** Sign always shown: `1234500` → `+1 234,500 DT`, `-2000` → `-2,000 DT`, `0` → `0,000 DT` (REQ-6.4). */
export function formatSignedMillimes(value: number): string {
  assertMillimes(value);
  return signed.format(value / MILLIMES_PER_DINAR);
}
