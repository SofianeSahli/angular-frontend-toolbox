import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '@shared/ui-atoms';

@Component({
  selector: 'ui-empty-state',
  imports: [UiIcon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyState {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly text = input<string>();
}
