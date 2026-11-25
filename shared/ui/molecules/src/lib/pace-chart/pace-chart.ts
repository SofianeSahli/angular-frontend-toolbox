import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  PLOT_BOTTOM,
  PLOT_END,
  PLOT_START,
  PLOT_TOP,
  UiPacePoint,
  UiPaceState,
  chartMax,
  linePath,
  overPath,
  paceState,
  referencePath,
  straightPath,
  tickDays,
  valueAt,
  xOf,
  yOf,
} from './pace-geometry';

export type { UiPacePoint, UiPaceState } from './pace-geometry';

@Component({
  selector: 'ui-pace-chart',
  template: `<svg class="ui-pace-chart__svg" role="img" [attr.aria-label]="summaryText()" [attr.viewBox]="viewBox" focusable="false">
      <g class="ui-pace-chart__plot">
        <line class="ui-pace-chart__axis" [attr.x1]="start" [attr.x2]="end" [attr.y1]="bottom" [attr.y2]="bottom" />
        @for (day of ticks(); track day) {
          <text class="ui-pace-chart__tick" [attr.x]="xOf(day)" [attr.y]="tickY">{{ day }}</text>
        }
        @if (referenceD(); as d) {
          <path class="ui-pace-chart__reference" [attr.d]="d" />
        }
        @if (targetD(); as d) {
          <path class="ui-pace-chart__target" [attr.d]="d" />
        }
        @if (todayX(); as x) {
          <line class="ui-pace-chart__today" [attr.x1]="x" [attr.x2]="x" [attr.y1]="top" [attr.y2]="bottom" />
        }
        @if (lineD(); as d) {
          <path class="ui-pace-chart__line" pathLength="1" [attr.d]="d" />
        }
        @if (overD(); as d) {
          <path class="ui-pace-chart__over" [attr.d]="d" />
        }
        @if (endDot(); as dot) {
          <circle class="ui-pace-chart__dot" r="3.5" [attr.cx]="dot.x" [attr.cy]="dot.y" />
        }
      </g>
    </svg>
    <table class="ui-pace-chart__table">
      <caption>{{ label() }}</caption>
      <tbody>
        @for (point of days(); track point.day) {
          <tr>
            <th scope="row">{{ point.day }}</th>
            <td>{{ point.value }}</td>
          </tr>
        }
      </tbody>
    </table>`,
  styleUrl: './pace-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-pace-chart--warning]': 'state() === "warning"',
    '[class.ui-pace-chart--over]': 'state() === "over"',
  },
})
export class UiPaceChart {
  readonly days = input.required<readonly UiPacePoint[]>();
  readonly daysInMonth = input.required<number, unknown>({ transform: numberAttribute });
  readonly today = input<number | undefined, unknown>(undefined, { transform: (value) => (value === undefined || value === null ? undefined : Number(value)) });
  readonly target = input<number | undefined, unknown>(undefined, { transform: (value) => (value === undefined || value === null ? undefined : Number(value)) });
  readonly reference = input<readonly number[]>();
  readonly label = input.required<string>();
  readonly summaryText = input.required<string>();

  protected readonly viewBox = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
  protected readonly start = PLOT_START;
  protected readonly end = PLOT_END;
  protected readonly bottom = PLOT_BOTTOM;
  protected readonly top = PLOT_TOP;
  protected readonly tickY = CHART_HEIGHT - 6;

  private readonly max = computed(() => chartMax(this.days(), this.target(), this.reference()));
  protected readonly ticks = computed(() => tickDays(this.daysInMonth()));
  protected readonly lineD = computed(() => linePath(this.days(), this.daysInMonth(), this.max(), this.today()));
  protected readonly overD = computed(() => (this.state() === 'over' ? overPath(this.days(), this.target(), this.daysInMonth(), this.max(), this.today()) : ''));
  protected readonly targetD = computed(() => {
    const target = this.target();
    return target !== undefined && target > 0 ? straightPath(target, this.daysInMonth(), this.max()) : '';
  });
  protected readonly referenceD = computed(() => referencePath(this.reference() ?? [], this.daysInMonth(), this.max()));
  protected readonly todayX = computed(() => {
    const today = this.today();
    return today === undefined ? null : xOf(today, this.daysInMonth());
  });
  protected readonly endDot = computed(() => {
    const last = valueAt(this.days(), this.today());
    return last === null ? null : { x: xOf(last.day, this.daysInMonth()), y: yOf(last.value, this.max()) };
  });

  readonly state = computed<UiPaceState>(() => {
    const last = valueAt(this.days(), this.today());
    return last === null ? 'ok' : paceState(last.value, this.target(), last.day, this.daysInMonth());
  });

  protected xOf(day: number): number {
    return xOf(day, this.daysInMonth());
  }
}
