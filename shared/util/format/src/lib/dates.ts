// Local calendar dates as `YYYY-MM-DD` (spec 002, REQ-6.6). Uses the local date parts, never
// `toISOString()`, so the day never shifts in UTC+1/+2. No Angular dependency.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** The local calendar day of `date`, as `YYYY-MM-DD`. */
export function toLocalIsoDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → local midnight of that day. Refuses other formats and impossible dates. */
export function fromLocalIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Expected a date as YYYY-MM-DD, got "${value}"`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  date.setFullYear(year); // years 0–99 are otherwise read as 1900–1999
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new RangeError(`"${value}" is not a calendar date`);
  }
  return date;
}
