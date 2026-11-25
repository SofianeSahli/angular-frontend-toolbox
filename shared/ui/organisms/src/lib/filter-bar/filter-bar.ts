import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-filter-bar',
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'search' },
})
export class UiFilterBar {}
