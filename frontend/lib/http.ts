import { apiUrl } from './config';

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(apiUrl(path), init);
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
  const resp = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init
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
