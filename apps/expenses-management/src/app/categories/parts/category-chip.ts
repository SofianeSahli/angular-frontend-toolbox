import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CategoryLabels } from '../data/category-labels';

@Component({
  selector: 'app-category-chip',
  template: `<span class="app-category-chip__emoji" aria-hidden="true">{{ emoji() }}</span
    >&ngsp;<bdi>{{ name() }}</bdi>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-inline-flex align-items-center gap-1' },
})
export class CategoryChip {
  readonly code = input.required<string>();
  readonly otherName = input<string | null>(null);

  private readonly labels = inject(CategoryLabels);

  protected readonly emoji = computed(() => this.labels.emoji(this.code()));
  protected readonly name = computed(() => this.otherName() || this.labels.name(this.code()));
}
