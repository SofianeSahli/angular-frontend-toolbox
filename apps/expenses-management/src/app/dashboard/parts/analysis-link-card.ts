import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiIcon } from '@shared/ui-atoms';

@Component({
  selector: 'app-analysis-link-card',
  imports: [RouterLink, TranslatePipe, UiIcon],
  templateUrl: './analysis-link-card.html',
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisLinkCard {
  readonly month = input.required<string>();
}
