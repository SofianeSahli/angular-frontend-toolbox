import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-drawer-header',
  imports: [],
  templateUrl: './drawer-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './drawer-header.scss',
})
export class DrawerHeader {
  user : any  = input.required();
}
