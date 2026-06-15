const TOKEN_KEY = "signape_access_token";
const COOKIE_NAME = "signape_token";
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type UserRole = "superadmin" | "signage" | "occupancy" | "both";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organization: string;
  phone: string;
  role: UserRole;
  status: string;
  firstTimeLogin: boolean;
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
  document.cookie = `signape_role=; path=/; max-age=0`;
  document.cookie = `signape_ftl=; path=/; max-age=0`;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function persistAuth(response: AuthResponse) {
  setAccessToken(response.accessToken);
  document.cookie = `signape_role=${response.user.role}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
  if (response.user.firstTimeLogin) {
    document.cookie = `signape_ftl=1; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `signape_ftl=; path=/; max-age=0`;
  }
}

export function clearFirstTimeLogin() {
  document.cookie = `signape_ftl=; path=/; max-age=0`;
}

export function getHomeForRole(role: UserRole): string {
  if (role === "superadmin") return "/admin";
  if (role === "occupancy") return "/room";
  return "/dashboard";
}
