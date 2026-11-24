import { DestroyRef, Signal, inject, signal } from '@angular/core';

const ONE_SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;

export interface Countdown {
  readonly remaining: Signal<number>;
  start(seconds: number): void;
}

export function countdown(): Countdown {
  const remaining = signal(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };
  inject(DestroyRef).onDestroy(stop);

  return {
    remaining: remaining.asReadonly(),
    start(seconds: number): void {
      stop();
      remaining.set(Math.max(0, Math.ceil(seconds)));
      if (remaining() === 0) return;
      timer = setInterval(() => {
        remaining.update((value) => value - 1);
        if (remaining() <= 0) stop();
      }, ONE_SECOND_MS);
    },
  };
}

export function minutesAndSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
