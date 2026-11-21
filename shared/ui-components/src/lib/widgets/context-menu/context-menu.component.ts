import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  colorClass?: string; 
  action: string; 
}

@Component({
  selector: 'lib-context-menu',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, TranslatePipe],
  templateUrl: './context-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent {
  menuId = input('contextMenu');
  items = input<ContextMenuItem[]>([]);
  context = input<any>();
  itemSelected = output<{ action: string; context: any }>();

  onSelect(action: string) {
    this.itemSelected.emit({ action, context: this.context() });
  }
}
