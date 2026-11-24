import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorPresenter } from '@shared/http-feature-errors';

@Component({
  selector: 'app-root',
  imports: [ErrorPresenter, RouterOutlet],
  template: '<router-outlet /><shared-error-presenter />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
