import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { UiPage } from '@shared/ui-templates';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, UiPage],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly account = inject(SessionStore).account;
}
