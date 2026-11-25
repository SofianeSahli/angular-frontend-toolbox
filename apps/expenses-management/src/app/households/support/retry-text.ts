import { TranslateService } from '@ngx-translate/core';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export function retryText(translate: TranslateService, seconds: number | null): string {
  const total = Math.max(1, Math.ceil(seconds ?? 0));
  if (total < SECONDS_PER_MINUTE) return translate.instant('households.retry.seconds', { n: total });
  if (total < SECONDS_PER_HOUR) return translate.instant('households.retry.minutes', { n: Math.ceil(total / SECONDS_PER_MINUTE) });
  return translate.instant('households.retry.hours', { n: Math.ceil(total / SECONDS_PER_HOUR) });
}
