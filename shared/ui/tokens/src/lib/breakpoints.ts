export const BREAKPOINTS = { medium: 820, wide: 1100 } as const;

export type UiBreakpoint = keyof typeof BREAKPOINTS;

const BELOW_OFFSET = 0.02;

export function mediaQueryDown(breakpoint: UiBreakpoint): string {
  return `(max-width: ${BREAKPOINTS[breakpoint] - BELOW_OFFSET}px)`;
}

export function mediaQueryUp(breakpoint: UiBreakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
}
