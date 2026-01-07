import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import 'moment/locale/fr'; // import French locale

@Pipe({
  name: 'timeAgo',
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | moment.Moment): string {
    if (!value) return '';
    moment.locale('fr');
    return moment(value).fromNow();
  }
}
