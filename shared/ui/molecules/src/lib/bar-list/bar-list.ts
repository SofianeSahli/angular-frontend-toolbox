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
  template: `@if (items().length === 0) {
      @if (emptyText(); as text) {
        <p class="ui-bar-list__empty">{{ text }}</p>
      }
    } @else {
      <ul class="ui-bar-list__rows">
        @for (item of items(); track item.id) {
          <li class="ui-bar-list__item">
            <ng-template #row>
              <span class="ui-bar-list__head">
                <span class="ui-bar-list__label">{{ item.label }}</span>
                <span class="ui-bar-list__value"
                  ><bdi>{{ item.valueText }}</bdi>
                  @if (item.shareText) {
                    <span class="ui-bar-list__share">{{ item.shareText }}</span>
                  }
                </span>
              </span>
              <span class="ui-bar-list__track" aria-hidden="true"
                ><span class="ui-bar-list__bar" [style.inline-size.%]="width(item)"></span
              ></span>
            </ng-template>
            @if (item.clickable) {
              <button type="button" class="ui-bar-list__row ui-bar-list__row--button" (click)="itemSelect.emit(item.id)">
                <ng-container [ngTemplateOutlet]="row" />
              </button>
            } @else {
              <div class="ui-bar-list__row"><ng-container [ngTemplateOutlet]="row" /></div>
            }
          </li>
        }
      </ul>
    }`,
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
