import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiList } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { Entry } from '../../operations/data/models';
import { EntryRow } from '../../operations/parts/entry-row';
import { dayGroups, uiLocale } from '../../operations/support/day-groups';
import { CardStatus } from '../data/dashboard.store';
import { CardFrame } from './card-frame';

@Component({
  selector: 'app-recent-card',
  imports: [CardFrame, EntryRow, RouterLink, TranslatePipe, UiList],
  template: `<app-card-frame [heading]="'dashboard.recent.title' | translate" [status]="status()" [error]="error()" (retry)="retry.emit()">
    <a cardAside routerLink="/operations" [queryParams]="{ mois: month() }">{{ 'dashboard.recent.seeAll' | translate }}</a>
    @if (groups().length === 0) {
      <p class="dashboard-card__muted">{{ 'dashboard.recent.empty' | translate }}</p>
    } @else {
      @for (group of groups(); track group.key) {
        <h3 class="dashboard-card__day">{{ group.label }}</h3>
        <ui-list>
          @for (entry of group.items; track entry.id) {
            <li><app-entry-row [entry]="entry" [currency]="currency()" [showAuthor]="true" (open)="open.emit($event)" /></li>
          }
        </ui-list>
      }
    }
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentCard {
  readonly entries = input.required<readonly Entry[]>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly month = input.required<string>();
  readonly today = input.required<string>();
  readonly retry = output<void>();
  readonly open = output<Entry>();

  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly groups = computed(() => {
    this.revision();
    return dayGroups(this.entries(), this.today(), {
      today: this.translate.instant('operations.list.today'),
      yesterday: this.translate.instant('operations.list.yesterday'),
      locale: uiLocale(this.translate.getCurrentLang()),
    });
  });
}
