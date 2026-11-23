import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-filter-bar',
  template: `<ng-content select="ui-search-field" />
    <ng-content />
    <span class="ui-filter-bar__reset"><ng-content select="[uiFilterReset]" /></span>`,
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'search' },
})
export class UiFilterBar {}
