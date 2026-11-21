import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-loader',
  templateUrl: './loader.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loader.scss',
})
export class Loader {
  loading = input<boolean>(false);
}
