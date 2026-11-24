import { ApiError } from '@shared/http-data-access';
import { DONE, toResult } from './store-result';

describe('toResult', () => {
  it('resolves to done when the action succeeds', async () => {
    expect(await toResult(() => Promise.resolve(1))).toBe(DONE);
  });

  it('keeps an ApiError as the error outcome', async () => {
    const error = new ApiError('conflict', 422, 'household.limit_reached', {}, null, 'r1');
    expect(await toResult(() => Promise.reject(error))).toEqual({ outcome: 'error', error });
  });

  it('wraps an unknown failure so the caller always gets an ApiError', async () => {
    const result = await toResult(() => Promise.reject(new Error('boom')));
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.error).toBeInstanceOf(ApiError);
  });
});
