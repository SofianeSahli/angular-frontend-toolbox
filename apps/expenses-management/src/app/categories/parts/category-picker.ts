import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiBadge, UiButton, UiChip, UiIcon } from '@shared/ui-atoms';
import { UiAlert, UiList, UiListItem, UiSearchField } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiDialog, UiDialogBody, UiDialogHeader } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { CategoriesStore } from '../data/categories.store';
import { CategoryLabels } from '../data/category-labels';
import { CategoryNode } from '../data/models';

export type CategoryPickerMode = 'entry' | 'filter';

export interface CategoryPickerData {
  readonly mode: CategoryPickerMode;
  readonly recents?: readonly string[];
}

interface Step {
  readonly top: string | null;
  readonly group: string | null;
}

interface Choice {
  readonly code: string;
  readonly emoji: string;
  readonly name: string;
  readonly path: string | null;
  readonly retired: boolean;
  readonly opens: boolean;
}

const ROOT: Step = { top: null, group: null };

@Component({
  selector: 'app-category-picker',
  imports: [TranslatePipe, UiAlert, UiBadge, UiButton, UiChip, UiDialogBody, UiDialogHeader, UiIcon, UiList, UiListItem, UiSearchField],
  templateUrl: './category-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPicker {
  protected readonly data = inject<CategoryPickerData>(DIALOG_DATA);
  protected readonly store = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly context = inject(UI_DIALOG_CONTEXT);
  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly filterMode = this.data.mode === 'filter';
  protected readonly step = signal<Step>(ROOT);
  protected readonly query = signal('');

  protected readonly unavailable = computed(() => this.store.status() === 'error' && this.store.tops().length === 0);

  protected readonly recents = computed(() =>
    (this.data.recents ?? [])
      .filter((code) => this.store.isOfferable(code))
      .map((code) => ({
        code,
        emoji: this.labels.emoji(code),
        name: this.labels.name(code),
      })),
  );

  protected readonly headingText = computed(() => {
    const { top, group } = this.step();
    if (group !== null) return this.labels.path(group);
    if (top !== null) return this.labels.name(top);
    return null;
  });

  protected readonly current = computed(() => {
    const { top, group } = this.step();
    return group ?? top;
  });

  protected readonly choices = computed<readonly Choice[]>(() => {
    const { top, group } = this.step();
    const topNode = top === null ? null : this.store.node(top);
    const groupNode = group === null ? null : this.store.node(group);
    if (groupNode?.group) return groupNode.group.leaves.map((leaf) => this.choice(leaf.code, false)).filter((c): c is Choice => c !== null);
    if (topNode) return topNode.top.groups.map((g) => this.choice(g.code, true)).filter((c): c is Choice => c !== null);
    return this.store
      .orderedTops()
      .map((t) => this.choice(t.code, true))
      .filter((c): c is Choice => c !== null);
  });

  protected readonly results = computed<readonly Choice[]>(() =>
    this.labels
      .search(this.query(), {
        branches: this.filterMode,
        retired: this.filterMode,
      })
      .map((node) => this.toChoice(node, false, this.labels.path(node.code))),
  );

  constructor() {
    void this.store.load();
  }

  protected open(choice: Choice): void {
    if (!choice.opens) {
      this.pick(choice.code);
      return;
    }
    const node = this.store.node(choice.code);
    if (node === null) return;
    this.moveTo(node.level === 'top' ? { top: node.code, group: null } : { top: node.top.code, group: node.code });
  }

  protected back(): void {
    const { top, group } = this.step();
    this.moveTo(group !== null ? { top, group: null } : ROOT);
  }

  protected pick(code: string): void {
    this.context.close(code);
  }

  protected retry(): void {
    void this.store.load({ force: true });
  }

  private moveTo(step: Step): void {
    this.step.set(step);
    afterNextRender(
      () => {
        const target = this.heading()?.nativeElement ?? this.host.querySelector<HTMLElement>('ui-search-field input');
        target?.focus();
      },
      { injector: this.injector },
    );
  }

  private choice(code: string, opens: boolean): Choice | null {
    const node = this.store.node(code);
    if (node === null || (node.retired && !this.filterMode)) return null;
    return this.toChoice(node, opens, null);
  }

  private toChoice(node: CategoryNode, opens: boolean, path: string | null): Choice {
    return {
      code: node.code,
      emoji: node.emoji,
      name: this.labels.name(node.code),
      path,
      retired: node.retired,
      opens,
    };
  }
}

export async function openCategoryPicker(dialog: UiDialog, data: CategoryPickerData): Promise<string | null> {
  const ref = dialog.open<string, CategoryPickerData, CategoryPicker>(CategoryPicker, { data, size: 'md', presentation: 'auto' });
  return (await firstValueFrom(ref.closed)) ?? null;
}
