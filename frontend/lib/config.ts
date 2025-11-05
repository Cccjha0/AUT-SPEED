const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

const normalized = (() => {
  if (!RAW_API_BASE) {
    return 'http://localhost:3001/api';
  }

  const trimmedBase = RAW_API_BASE.replace(/\/$/, '');
  if (trimmedBase.endsWith('/api')) {
    return trimmedBase;
  }

  return `${trimmedBase}/api`;
})();

export const API_BASE = normalized;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
