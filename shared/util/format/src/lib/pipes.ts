import { Pipe, PipeTransform } from '@angular/core';
import { toLocalIsoDate } from './dates';
import { formatMillimes, formatMillimesHeadline, formatSignedMillimes } from './money';

// One pure pipe per formatter (spec 002, REQ-6.7).

/** `{{ 1234500 | uiMillimes }}` → `1 234,500 DT` */
@Pipe({ name: 'uiMillimes' })
export class MillimesPipe implements PipeTransform {
  transform(value: number): string {
    return formatMillimes(value);
  }
}

/** `{{ 1234500 | uiMillimesHeadline }}` → `1 235 DT` */
@Pipe({ name: 'uiMillimesHeadline' })
export class MillimesHeadlinePipe implements PipeTransform {
  transform(value: number): string {
    return formatMillimesHeadline(value);
  }
}

/** `{{ 1234500 | uiSignedMillimes }}` → `+1 234,500 DT` */
@Pipe({ name: 'uiSignedMillimes' })
export class SignedMillimesPipe implements PipeTransform {
  transform(value: number): string {
    return formatSignedMillimes(value);
  }
}

/** `{{ date | uiLocalIsoDate }}` → `2026-03-29` */
@Pipe({ name: 'uiLocalIsoDate' })
export class LocalIsoDatePipe implements PipeTransform {
  transform(value: Date): string {
    return toLocalIsoDate(value);
  }
}
