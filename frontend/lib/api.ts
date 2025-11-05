import { apiUrl } from './config';
import type { SearchResponse } from './types';

export async function fetchSearchData<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<SearchResponse<T>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  const url = apiUrl(
    `${endpoint}${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`
  );

  try {
    const response = await fetch(url, { cache: 'no-store' });
    const payload = (await response.json().catch(() => ({}))) as SearchResponse<T>;

    if (!response.ok) {
      return {
        error: {
          message: payload?.error?.message ?? `Request failed (${response.status})`
        }
      };
    }

    return payload;
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Request failed'
      }
    };
  }
}
