const TOKEN_KEY = "techy_admin_token";

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function notifyUnauthorized(): void {
  clearAuthToken();
  window.dispatchEvent(new Event("admin:unauthorized"));
}