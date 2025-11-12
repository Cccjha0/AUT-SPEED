export const AUTH_TOKEN_KEY = "speed-auth-token";
export const AUTH_ROLES_KEY = "speed-auth-roles";
export const AUTH_USER_EMAIL_KEY = "speed-auth-user";

export function storeAuthSession(token: string, roles: string[], email?: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(roles ?? []));
  if (email) {
    window.localStorage.setItem(AUTH_USER_EMAIL_KEY, email);
  }
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

export function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_USER_EMAIL_KEY);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_ROLES_KEY);
  window.localStorage.removeItem(AUTH_USER_EMAIL_KEY);
}
