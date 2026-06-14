const TOKEN_KEY = "signape_access_token";
const COOKIE_NAME = "signape_token";
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organization: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function persistAuth(response: AuthResponse) {
  setAccessToken(response.accessToken);
}
