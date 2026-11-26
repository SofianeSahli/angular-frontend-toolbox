import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'li[uiListItem], a[uiListItem], button[uiListItem]',
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiListItem {}
