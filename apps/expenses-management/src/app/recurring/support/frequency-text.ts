import { TranslateService } from '@ngx-translate/core';
import { Frequency } from '../data/models';

export function frequencyText(translate: TranslateService, frequency: Frequency, interval: number): string {
  return interval === 1
    ? translate.instant(`recurring.frequency.${frequency}`)
    : translate.instant(`recurring.frequency.every.${frequency}`, { n: interval });
}
