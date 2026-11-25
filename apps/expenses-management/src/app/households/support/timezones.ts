export const DEFAULT_TIMEZONE = 'Africa/Tunis';

const FALLBACK_TIMEZONES = ['Africa/Algiers', 'Africa/Casablanca', 'Africa/Tunis', 'America/Montreal', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'Europe/Paris', 'UTC'];

export function timezoneList(): readonly string[] {
  const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : FALLBACK_TIMEZONES;
  return supported.includes(DEFAULT_TIMEZONE) ? supported : [DEFAULT_TIMEZONE, ...supported];
}
