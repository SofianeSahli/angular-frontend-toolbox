import { ApiError } from '@shared/http-data-access';

export type StoreResult = { readonly outcome: 'done' } | { readonly outcome: 'error'; readonly error: ApiError };

export const DONE: StoreResult = { outcome: 'done' };

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('server', 0, 'http.unknown', {}, null, '');
}

export async function toResult(action: () => Promise<unknown>): Promise<StoreResult> {
  try {
    await action();
    return DONE;
  } catch (error) {
    return { outcome: 'error', error: toApiError(error) };
  }
}
