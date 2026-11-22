import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-loader',
  templateUrl: './loader.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './loader.scss',
})
export class Loader {
  loading = input<boolean>(false);
}
