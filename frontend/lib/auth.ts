export const AUTH_TOKEN_KEY = "speed-auth-token";
export const AUTH_ROLES_KEY = "speed-auth-roles";

export function storeAuthSession(token: string, roles: string[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(roles ?? []));
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredRoles(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_ROLES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_ROLES_KEY);
}
