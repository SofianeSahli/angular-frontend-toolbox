import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert } from '@shared/ui-molecules';
import { CardStatus } from '../data/dashboard.store';

let nextFrameId = 0;

@Component({
  selector: 'app-card-frame',
  imports: [TranslatePipe, UiAlert, UiButton, UiSkeleton],
  template: `<section class="dashboard-card" [attr.aria-labelledby]="headingId" [attr.aria-busy]="status() === 'loading'">
    <header class="dashboard-card__header">
      <h2 class="dashboard-card__title" [id]="headingId">{{ heading() }}</h2>
      <div class="dashboard-card__aside"><ng-content select="[cardAside]" /></div>
    </header>
    @switch (status()) {
      @case ('loading') {
        <div class="d-flex flex-column gap-2" role="status" [attr.aria-label]="'dashboard.loading' | translate">
          <ui-skeleton />
          <ui-skeleton />
          <ui-skeleton />
        </div>
      }
      @case ('error') {
        <ui-alert tone="danger">
          {{ (offline() ? 'dashboard.offline' : 'dashboard.cardError') | translate }}
          <div uiAlertActions>
            <button uiButton size="sm" type="button" (click)="retry.emit()">{{ 'dashboard.retry' | translate }}</button>
          </div>
        </ui-alert>
      }
      @default {
        <ng-content />
      }
    }
  </section>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFrame {
  readonly heading = input.required<string>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly retry = output<void>();

  protected readonly headingId = `dashboard-card-${nextFrameId++}`;
  protected readonly offline = computed(() => this.error()?.code === 'http.offline');
}
