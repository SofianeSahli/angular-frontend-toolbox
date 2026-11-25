import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiBadge, UiButton, UiChip, UiIcon } from '@shared/ui-atoms';
import { UiAlert, UiList, UiListItem, UiSearchField } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiDialog, UiDialogBody, UiDialogHeader } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { CategoriesStore } from '../data/categories.store';
import { CategoryLabels } from '../data/category-labels';
import { CategoryNode } from '../data/models';
import { overlaps } from '../data/overlap';

export type CategoryPickerMode = 'entry' | 'filter' | 'plan';

export interface CategoryPickerData {
  readonly mode: CategoryPickerMode;
  readonly recents?: readonly string[];
  readonly excluded?: readonly string[];
}

interface Choice {
  readonly code: string;
  readonly emoji: string;
  readonly name: string;
  readonly path: string | null;
  readonly retired: boolean;
}

interface GroupChoice extends Choice {
  readonly leaves: readonly Choice[];
}

interface TopChoice extends Choice {
  readonly groups: readonly GroupChoice[];
  readonly pickable: boolean;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

@Component({
  selector: 'app-category-picker',
  imports: [TranslatePipe, UiAlert, UiBadge, UiButton, UiChip, UiDialogBody, UiDialogHeader, UiIcon, UiList, UiListItem, UiSearchField],
  templateUrl: './category-picker.html',
  styleUrl: './category-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPicker {
  protected readonly data = inject<CategoryPickerData>(DIALOG_DATA);
  protected readonly store = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly context = inject(UI_DIALOG_CONTEXT);
  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly filterMode = this.data.mode === 'filter';
  protected readonly planMode = this.data.mode === 'plan';
  private readonly excluded = this.data.excluded ?? [];
  protected readonly openTop = signal<string | null>(null);
  protected readonly openGroup = signal<string | null>(null);
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

  protected readonly tops = computed<readonly TopChoice[]>(() => (this.planMode ? this.planTops() : this.browseTops()));

  private planTops(): readonly TopChoice[] {
    return this.store.orderedTops().flatMap((top) => {
      const choice = this.choice(top.code);
      if (choice === null || top.type !== 'expense') return [];
      const groups = top.groups.filter((group) => this.plannable(group.code)).flatMap((group) => {
        const groupChoice = this.choice(group.code);
        return groupChoice === null ? [] : [{ ...groupChoice, leaves: [] }];
      });
      const pickable = this.plannable(top.code);
      return pickable || groups.length > 0 ? [{ ...choice, groups, pickable }] : [];
    });
  }

  private browseTops(): readonly TopChoice[] {
    return this.store.orderedTops().flatMap((top) => {
      const choice = this.choice(top.code);
      if (choice === null) return [];
      const groups = top.groups.flatMap((group) => {
        const groupChoice = this.choice(group.code);
        if (groupChoice === null) return [];
        const leaves = group.leaves.map((leaf) => this.choice(leaf.code)).filter((c): c is Choice => c !== null);
        return [{ ...groupChoice, leaves }];
      });
      return [{ ...choice, groups, pickable: this.filterMode }];
    });
  }

  protected readonly results = computed<readonly Choice[]>(() =>
    this.labels
      .search(this.query(), {
        branches: this.filterMode || this.planMode,
        retired: this.filterMode,
      })
      .filter((node) => !this.planMode || this.plannable(node.code))
      .map((node) => this.toChoice(node, this.labels.path(node.code))),
  );

  protected readonly title = this.filterMode ? 'categories.picker.filterTitle' : this.planMode ? 'categories.picker.planTitle' : 'categories.picker.title';

  constructor() {
    void this.store.load();
  }

  protected panelId(code: string): string {
    return `category-picker-panel-${code.replaceAll('.', '-')}`;
  }

  protected toggleTop(code: string): void {
    const opening = this.openTop() !== code;
    this.openTop.set(opening ? code : null);
    this.openGroup.set(null);
    if (opening) this.revealWithoutMotion(code);
  }

  protected toggleGroup(code: string): void {
    const opening = this.openGroup() !== code;
    this.openGroup.set(opening ? code : null);
    if (opening) this.revealWithoutMotion(code);
  }

  protected settled(event: TransitionEvent, code: string): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') return;
    if (this.openTop() === code || this.openGroup() === code) this.reveal(event.currentTarget as HTMLElement, false);
  }

  protected pick(code: string): void {
    this.context.close(code);
  }

  protected retry(): void {
    void this.store.load({ force: true });
  }

  private revealWithoutMotion(code: string): void {
    if (!this.reducedMotion()) return;
    afterNextRender(
      () => {
        const panel = this.host.querySelector<HTMLElement>(`[id="${this.panelId(code)}"]`);
        if (panel) this.reveal(panel, true);
      },
      { injector: this.injector },
    );
  }

  private reveal(panel: HTMLElement, instant: boolean): void {
    const scroller = panel.closest<HTMLElement>('.ui-dialog-body');
    const header = panel.previousElementSibling;
    if (scroller === null || header === null) return;
    if (panel.getBoundingClientRect().bottom <= scroller.getBoundingClientRect().bottom) return;
    header.scrollIntoView({ block: 'start', behavior: instant ? 'auto' : 'smooth' });
  }

  private reducedMotion(): boolean {
    return this.host.ownerDocument.defaultView?.matchMedia?.(REDUCED_MOTION).matches ?? false;
  }

  private plannable(code: string): boolean {
    const node = this.store.node(code);
    return (
      node !== null &&
      node.level !== 'leaf' &&
      node.type === 'expense' &&
      !node.retired &&
      !this.excluded.some((line) => overlaps(line, code))
    );
  }

  private choice(code: string): Choice | null {
    const node = this.store.node(code);
    if (node === null || (node.retired && !this.filterMode)) return null;
    return this.toChoice(node, null);
  }

  private toChoice(node: CategoryNode, path: string | null): Choice {
    return {
      code: node.code,
      emoji: node.emoji,
      name: this.labels.name(node.code),
      path,
      retired: node.retired,
    };
  }
}

export async function openCategoryPicker(dialog: UiDialog, data: CategoryPickerData): Promise<string | null> {
  const ref = dialog.open<string, CategoryPickerData, CategoryPicker>(CategoryPicker, { data, size: 'md', presentation: 'auto' });
  return (await firstValueFrom(ref.closed)) ?? null;
}
