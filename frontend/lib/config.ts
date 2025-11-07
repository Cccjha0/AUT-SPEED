const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export const API_BASE = RAW_API_BASE.replace(/\/$/, '');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
