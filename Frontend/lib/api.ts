/**
 * Shared API utility for Freight Flow frontend.
 * Every fetch in the app goes through these helpers so the base URL
 * and Authorization header are set in exactly one place.
 */

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "https://obedf-1.onrender.com";
export const API_BASE = rawApiBase.replace(/\/+$/, "");

/** Returns the JWT bearer header if a token is stored, otherwise {}. */
export function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Default JSON headers + auth. */
export function jsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...authHeader(),
  };
}

/**
 * Thin wrapper around fetch that:
 *  - Prepends API_BASE to relative paths
 *  - Attaches auth + JSON headers automatically
 *  - Throws a descriptive Error on non-OK responses
 *  - Returns the parsed JSON body
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...jsonHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as { error?: string; message?: string }).error ||
      (data as { error?: string; message?: string }).message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

/** Convenience shorthands */
export const apiGet  = <T>(path: string) => apiFetch<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut  = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PUT",  body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: "DELETE" });
