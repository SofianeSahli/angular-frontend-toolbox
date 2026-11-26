import { ApiError } from '@shared/http-data-access';

export type CardStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Card<T> {
  readonly status: CardStatus;
  readonly data: T | null;
  readonly error: ApiError | null;
}

export const idleCard = <T>(): Card<T> => ({ status: 'idle', data: null, error: null });

export function shownStatus(status: CardStatus): CardStatus {
  return status === 'idle' ? 'loading' : status;
}
