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
