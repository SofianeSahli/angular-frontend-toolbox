import { Component,  input } from '@angular/core';

@Component({
  selector: 'lib-drawer-header',
  imports: [],
  templateUrl: './drawer-header.html',
  styleUrl: './drawer-header.scss',
})
export class DrawerHeader {
  user : any  = input.required();
}
