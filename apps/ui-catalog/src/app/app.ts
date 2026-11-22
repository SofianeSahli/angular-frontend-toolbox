import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CatalogPage } from './catalog/catalog.page';

@Component({
  selector: 'app-root',
  imports: [CatalogPage],
  template: '<app-catalog-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
