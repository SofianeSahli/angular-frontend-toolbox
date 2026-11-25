import { ChangeDetectionStrategy, Component, Directive } from '@angular/core';

@Component({
  selector: 'table[uiTable]',
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTable {}

@Directive({
  selector: 'tr[uiTableGroup]',
  host: { class: 'ui-table__group' },
})
export class UiTableGroup {}

@Directive({
  selector: 'td[uiNum], th[uiNum]',
  host: { class: 'ui-table__num' },
})
export class UiTableNumber {}
