import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { CardFrame } from '../card-frame/card-frame';

@Component({
  selector: 'app-first-use-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiButton, UiIcon],
  templateUrl: './first-use-card.html',
  styleUrl: '../dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirstUseCard {
  readonly add = output<void>();
}
