import {
  Component,
  input,
  output,
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
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, TranslatePipe],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent {
  menuId = input('contextMenu');
  items = input<ContextMenuItem[]>([]);
  context = input<any>();
  select = output<{ action: string; context: any }>();

  onSelect(action: string) {
    this.select.emit({ action, context: this.context() });
  }
}
