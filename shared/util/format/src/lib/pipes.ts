import { Pipe, PipeTransform } from '@angular/core';
import { toLocalIsoDate } from './dates';
import { CurrencyFormat, formatMillimes, formatMillimesHeadline, formatMinor, formatSignedMillimes } from './money';

@Pipe({ name: 'uiMillimes' })
export class MillimesPipe implements PipeTransform {
  transform(value: number): string {
    return formatMillimes(value);
  }
}

@Pipe({ name: 'uiMillimesHeadline' })
export class MillimesHeadlinePipe implements PipeTransform {
  transform(value: number): string {
    return formatMillimesHeadline(value);
  }
}

@Pipe({ name: 'uiSignedMillimes' })
export class SignedMillimesPipe implements PipeTransform {
  transform(value: number): string {
    return formatSignedMillimes(value);
  }
}

@Pipe({ name: 'uiLocalIsoDate' })
export class LocalIsoDatePipe implements PipeTransform {
  transform(value: Date): string {
    return toLocalIsoDate(value);
  }
}

@Pipe({ name: 'minor' })
export class MinorPipe implements PipeTransform {
  transform(value: number, currency: CurrencyFormat): string {
    return formatMinor(value, currency);
  }
}
