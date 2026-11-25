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
  templateUrl: './recent-card.html',
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
