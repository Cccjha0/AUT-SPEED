import { describe, expect, it, vi } from 'vitest';
import { fetchRealtimeJson, fetchSearchList } from '../../../lib/api/search';
import type { SearchResponse } from '../../../lib/types';

describe('fetchSearchList', () => {
  it('uses incremental revalidation for list pages', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { items: [], total: 0, limit: 10, skip: 0 }
        } satisfies SearchResponse<unknown>)
      } as unknown as Response);

    await fetchSearchList('/search/practices', { limit: 10, skip: 0 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/search/practices'),
      expect.objectContaining({
        next: { revalidate: 60 }
      })
    );

    fetchSpy.mockRestore();
  });
});

describe('fetchRealtimeJson', () => {
  it('disables caching for queue and rating endpoints', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      } as unknown as Response);

    await fetchRealtimeJson('/moderation/queue', { limit: 50, skip: 0 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/moderation/queue'),
      expect.objectContaining({
        cache: 'no-store'
      })
    );

    fetchSpy.mockRestore();
  });
});
