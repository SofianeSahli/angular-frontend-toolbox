export type UiPaceState = 'ok' | 'warning' | 'over';

export interface UiPacePoint {
  readonly day: number;
  readonly value: number;
}

export const CHART_WIDTH = 320;
export const CHART_HEIGHT = 140;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

export const PLOT_BOTTOM = CHART_HEIGHT - PAD_BOTTOM;
const PLOT_WIDTH = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

export const PLOT_TOP = PAD_TOP;
export const PLOT_START = PAD_LEFT;
export const PLOT_END = CHART_WIDTH - PAD_RIGHT;

export function chartMax(points: readonly UiPacePoint[], target: number | undefined, reference: readonly number[] | undefined): number {
  const values = [...points.map((point) => point.value), ...(reference ?? []), target ?? 0];
  const max = Math.max(0, ...values);
  return max > 0 ? max : 1;
}

export function xOf(day: number, daysInMonth: number): number {
  return PAD_LEFT + (Math.min(Math.max(day, 0), daysInMonth) / Math.max(daysInMonth, 1)) * PLOT_WIDTH;
}

export function yOf(value: number, max: number): number {
  return PLOT_BOTTOM - (Math.min(Math.max(value, 0), max) / max) * PLOT_HEIGHT;
}

function format(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function pathOf(coordinates: readonly (readonly [number, number])[]): string {
  return coordinates.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${format(x)} ${format(y)}`).join(' ');
}

export function linePath(points: readonly UiPacePoint[], daysInMonth: number, max: number, today?: number): string {
  const shown = points.filter((point) => today === undefined || point.day <= today);
  if (shown.length === 0) return '';
  return pathOf([[xOf(0, daysInMonth), yOf(0, max)], ...shown.map((point): [number, number] => [xOf(point.day, daysInMonth), yOf(point.value, max)])]);
}

export function straightPath(target: number, daysInMonth: number, max: number): string {
  return pathOf([
    [xOf(0, daysInMonth), yOf(0, max)],
    [xOf(daysInMonth, daysInMonth), yOf(target, max)],
  ]);
}

export function referencePath(values: readonly number[], daysInMonth: number, max: number): string {
  if (values.length === 0) return '';
  const shown = values.slice(0, daysInMonth);
  return pathOf([[xOf(0, daysInMonth), yOf(0, max)], ...shown.map((value, index): [number, number] => [xOf(index + 1, daysInMonth), yOf(value, max)])]);
}

export function overPath(points: readonly UiPacePoint[], target: number | undefined, daysInMonth: number, max: number, today?: number): string {
  if (target === undefined || !(target > 0)) return '';
  const shown = points.filter((point) => today === undefined || point.day <= today);
  const first = shown.findIndex((point) => point.value > target);
  if (first < 0) return '';
  const from = shown.slice(Math.max(first - 1, 0));
  return pathOf(from.map((point): [number, number] => [xOf(point.day, daysInMonth), yOf(point.value, max)]));
}

export function valueAt(points: readonly UiPacePoint[], today?: number): UiPacePoint | null {
  const shown = points.filter((point) => today === undefined || point.day <= today);
  return shown.length === 0 ? null : shown[shown.length - 1];
}

export function paceState(value: number, target: number | undefined, day: number, daysInMonth: number): UiPaceState {
  if (target === undefined || !(target > 0) || daysInMonth <= 0) return 'ok';
  if (value > target) return 'over';
  return value > (target * day) / daysInMonth ? 'warning' : 'ok';
}

export function tickDays(daysInMonth: number): readonly number[] {
  if (daysInMonth <= 1) return [1];
  return [...new Set([1, Math.ceil(daysInMonth / 2), daysInMonth])];
}
