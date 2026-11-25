import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CatalogToolbar } from './catalog-toolbar';

@Component({
  selector: 'app-catalog-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CatalogToolbar],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogLayout {}
