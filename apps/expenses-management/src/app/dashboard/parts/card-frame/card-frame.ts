import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert } from '@shared/ui-molecules';
import { CardStatus } from '../../data/dashboard.store';

let nextFrameId = 0;

@Component({
  selector: 'app-card-frame',
  imports: [TranslatePipe, UiAlert, UiButton, UiSkeleton],
  templateUrl: './card-frame.html',
  styleUrl: '../dashboard-card.scss',
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
