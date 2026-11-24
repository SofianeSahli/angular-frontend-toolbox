import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '@shared/ui-atoms';

@Component({
  selector: 'ui-empty-state',
  imports: [UiIcon],
  template: `<ui-icon class="ui-empty-state__icon" [name]="icon()" tile [size]="24" />
    <h2 class="ui-empty-state__title">{{ title() }}</h2>
    @if (text(); as description) {
      <p class="ui-empty-state__text">{{ description }}</p>
    }
    <ng-content />`,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyState {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly text = input<string>();
}
