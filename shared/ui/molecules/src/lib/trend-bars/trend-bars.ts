import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface UiTrendItem {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly valueText: string;
  readonly current?: boolean;
}

interface Bar {
  readonly item: UiTrendItem;
  readonly x: number;
  readonly width: number;
  readonly y: number;
  readonly height: number;
  readonly center: number;
}

const WIDTH = 320;
const HEIGHT = 150;
const PAD_X = 8;
const PAD_TOP = 22;
const PAD_BOTTOM = 24;
const GAP_RATIO = 0.35;
const MIN_BAR = 2;

@Component({
  selector: 'ui-trend-bars',
  template: `<svg class="ui-trend-bars__svg" role="group" [attr.aria-label]="label()" [attr.viewBox]="viewBox" focusable="false">
      <g class="ui-trend-bars__plot">
        <line class="ui-trend-bars__axis" [attr.x1]="padX" [attr.x2]="width - padX" [attr.y1]="baseline" [attr.y2]="baseline" />
        @for (bar of bars(); track bar.item.id) {
          <g
            class="ui-trend-bars__bar"
            [class.ui-trend-bars__bar--current]="bar.item.current"
            role="button"
            tabindex="0"
            [attr.aria-label]="bar.item.label + ', ' + bar.item.valueText"
            [attr.aria-current]="bar.item.current ? 'true' : null"
            (click)="itemSelect.emit(bar.item.id)"
            (keydown.enter)="itemSelect.emit(bar.item.id)"
            (keydown.space)="select($event, bar.item.id)"
          >
            <rect class="ui-trend-bars__hit" [attr.x]="bar.x - gapHalf()" [attr.y]="0" [attr.width]="bar.width + 2 * gapHalf()" [attr.height]="baseline + bottom" />
            @if (bar.height > 0) {
              <rect class="ui-trend-bars__fill" rx="3" [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" />
            }
            <text class="ui-trend-bars__value" [attr.x]="bar.center" [attr.y]="bar.y - 5">{{ bar.item.valueText }}</text>
            <text class="ui-trend-bars__label" [attr.x]="bar.center" [attr.y]="height - 7">{{ bar.item.label }}</text>
          </g>
        }
      </g>
    </svg>
    @if (averageText(); as text) {
      <p class="ui-trend-bars__average">{{ text }}</p>
    }
    <table class="ui-trend-bars__table">
      <caption>{{ label() }}</caption>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <th scope="row">{{ item.label }}</th>
            <td>{{ item.valueText }}</td>
          </tr>
        }
      </tbody>
    </table>`,
  styleUrl: './trend-bars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTrendBars {
  readonly items = input.required<readonly UiTrendItem[]>();
  readonly averageText = input<string>();
  readonly label = input.required<string>();
  readonly itemSelect = output<string>();

  protected readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly padX = PAD_X;
  protected readonly bottom = PAD_BOTTOM;
  protected readonly baseline = HEIGHT - PAD_BOTTOM;

  private readonly slot = computed(() => (WIDTH - 2 * PAD_X) / Math.max(this.items().length, 1));
  protected readonly gapHalf = computed(() => (this.slot() * GAP_RATIO) / 2);

  protected readonly bars = computed<readonly Bar[]>(() => {
    const items = this.items();
    const max = Math.max(0, ...items.map((item) => item.value));
    const slot = this.slot();
    const width = slot * (1 - GAP_RATIO);
    const room = HEIGHT - PAD_BOTTOM - PAD_TOP;
    return items.map((item, index) => {
      const x = PAD_X + index * slot + (slot - width) / 2;
      const height = item.value > 0 && max > 0 ? Math.max((item.value / max) * room, MIN_BAR) : 0;
      return { item, x, width, height, y: HEIGHT - PAD_BOTTOM - height, center: x + width / 2 };
    });
  });

  protected select(event: Event, id: string): void {
    event.preventDefault();
    this.itemSelect.emit(id);
  }
}
