import { apiUrl } from './config';
import { getAuthToken } from './auth';

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(apiUrl(path), withAuth(init));
  if (!resp.ok) {
    throw { status: resp.status, message: await resp.text() };
  }

  const json = await resp.json();
  if (json?.error) {
    throw { status: resp.status, message: json.error };
  }

  return json?.data ?? json;
}

async function sendJSON<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const authInit = withAuth(init);
  const headers = normalizeHeaders(authInit.headers);
  const resp = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...authInit
  });

  if (!resp.ok) {
    throw { status: resp.status, message: await resp.text() };
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  const json = await resp.json();
  if (json?.error) {
    throw { status: resp.status, message: json.error };
  }

  return json?.data ?? json;
}

export function postJSON<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return sendJSON<T>('POST', path, body, init);
}

export function patchJSON<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return sendJSON<T>('PATCH', path, body, init);
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...(headers as Record<string, string>) };
}

function withAuth(init?: RequestInit): RequestInit {
  if (typeof window === 'undefined') {
    return init ?? {};
  }
  const token = getAuthToken();
  if (!token) {
    return init ?? {};
  }
  const headers = normalizeHeaders(init?.headers);
  headers.Authorization = `Bearer ${token}`;
  return {
    ...init,
    headers
  };
}
