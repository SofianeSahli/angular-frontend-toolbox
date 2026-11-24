import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'identity-or-divider',
  template: '<span class="identity-or-divider__text"><ng-content /></span>',
  styleUrl: './or-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrDivider {}
