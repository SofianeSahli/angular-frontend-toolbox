import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { UiSkeleton } from '@shared/ui-atoms';
import { UiList } from '@shared/ui-molecules';

export interface UiListGroup<T> {
  readonly key: string;
  readonly label: string;
  readonly total?: string;
  readonly items: readonly T[];
}

export interface UiGroupedListRowContext<T> {
  readonly $implicit: T;
}

const SKELETON_ROWS = [0, 1, 2];

let nextListId = 0;

@Component({
  selector: 'ui-grouped-list',
  imports: [NgTemplateOutlet, UiList, UiSkeleton],
  templateUrl: './grouped-list.html',
  styleUrl: './grouped-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiGroupedList<T> {
  readonly groups = input.required<readonly UiListGroup<T>[]>();
  readonly itemTemplate = input.required<TemplateRef<UiGroupedListRowContext<T>>>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly empty = input<TemplateRef<unknown>>();
  readonly endReached = output<void>();

  protected readonly skeletonRows = SKELETON_ROWS;
  private readonly listId = `ui-grouped-list-${nextListId++}`;
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const Observer = this.sentinel().nativeElement.ownerDocument.defaultView?.IntersectionObserver;
      if (!Observer) return;
      const observer = new Observer((entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !this.loading()) this.endReached.emit();
      });
      observer.observe(this.sentinel().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected headerId(group: UiListGroup<T>): string {
    return `${this.listId}-${group.key}`;
  }
}
