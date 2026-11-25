import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface UiBarItem {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly valueText: string;
  readonly shareText?: string;
  readonly clickable?: boolean;
}

@Component({
  selector: 'ui-bar-list',
  imports: [NgTemplateOutlet],
  templateUrl: './bar-list.html',
  styleUrl: './bar-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBarList {
  readonly items = input.required<readonly UiBarItem[]>();
  readonly emptyText = input<string>();
  readonly itemSelect = output<string>();

  private readonly largest = computed(() => this.items().reduce((max, item) => Math.max(max, item.value), 0));

  protected width(item: UiBarItem): number {
    const largest = this.largest();
    return largest > 0 ? (Math.max(item.value, 0) / largest) * 100 : 0;
  }
}
