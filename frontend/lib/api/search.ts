import { apiUrl } from '../config';
import type { SearchResponse } from '../types';

type SearchParams = Record<string, string | number | undefined>;

function buildUrl(endpoint: string, params?: SearchParams) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      searchParams.set(key, String(value));
    });
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  return apiUrl(`${endpoint}${query}`);
}

async function callApi<T>(endpoint: string, params: SearchParams | undefined, init: RequestInit) {
  const url = buildUrl(endpoint, params);
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as T;
  return { response, payload };
}

export async function fetchSearchList<T>(
  endpoint: string,
  params: SearchParams
): Promise<SearchResponse<T>> {
  const { response, payload } = await callApi<SearchResponse<T>>(endpoint, params, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    return {
      error: {
        message: payload?.error?.message ?? `Request failed (${response.status})`
      }
    };
  }

  return payload;
}

export async function fetchRealtimeJson<T>(
  endpoint: string,
  params?: SearchParams
): Promise<{ response: Response; payload: T }> {
  return callApi<T>(endpoint, params, { cache: 'no-store' });
}
