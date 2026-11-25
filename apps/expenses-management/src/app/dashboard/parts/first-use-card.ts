import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { CardFrame } from './card-frame';

@Component({
  selector: 'app-first-use-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiButton, UiIcon],
  template: `<app-card-frame [heading]="'dashboard.firstUse.title' | translate">
    <p class="dashboard-card__muted">{{ 'dashboard.firstUse.text' | translate }}</p>
    <div class="dashboard-card__actions">
      <button uiButton variant="primary" type="button" (click)="add.emit()"><ui-icon name="plus" />{{ 'dashboard.firstUse.add' | translate }}</button>
      <a uiButton variant="secondary" routerLink="/budget">{{ 'dashboard.firstUse.budget' | translate }}</a>
    </div>
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirstUseCard {
  readonly add = output<void>();
}
