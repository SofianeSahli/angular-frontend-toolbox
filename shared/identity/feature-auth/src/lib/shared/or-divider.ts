import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'identity-or-divider',
  templateUrl: './or-divider.html',
  styleUrl: './or-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrDivider {}
