import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-placeholder',
  imports: [RouterLink, TranslatePipe],
  template: `<main class="container py-5 d-flex flex-column gap-3">
    <h1>{{ titleKey | translate }}</h1>
    <p class="mb-0">{{ 'legal.comingSoon' | translate }}</p>
    <a routerLink="/">{{ 'legal.back' | translate }}</a>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPlaceholder {
  protected readonly titleKey: string = inject(ActivatedRoute).snapshot.data['titleKey'] ?? '';
}
