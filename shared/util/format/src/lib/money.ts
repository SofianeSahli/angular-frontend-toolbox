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

export function assertMillimes(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected an integer number of millimes, got ${String(value)}`);
  }
}

export function formatMillimes(value: number): string {
  assertMillimes(value);
  return exact.format(value / MILLIMES_PER_DINAR);
}

export function formatMillimesHeadline(value: number): string {
  assertMillimes(value);
  return headline.format(value / MILLIMES_PER_DINAR);
}

export function formatSignedMillimes(value: number): string {
  assertMillimes(value);
  return signed.format(value / MILLIMES_PER_DINAR);
}

const signedHeadline = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});

export function formatSignedMillimesHeadline(value: number): string {
  assertMillimes(value);
  return signedHeadline.format(value / MILLIMES_PER_DINAR);
}
