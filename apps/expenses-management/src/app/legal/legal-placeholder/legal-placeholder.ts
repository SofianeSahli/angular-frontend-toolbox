import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-placeholder',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './legal-placeholder.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPlaceholder {
  protected readonly titleKey: string = inject(ActivatedRoute).snapshot.data['titleKey'] ?? '';
}
