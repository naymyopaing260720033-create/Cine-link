const BROWSER_REQUEST_TOKEN_KEY = "cinelink:request-history:browser-token";

export function getStoredBrowserRequestToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BROWSER_REQUEST_TOKEN_KEY);
}

export function getOrCreateBrowserRequestToken() {
  const existing = getStoredBrowserRequestToken();
  if (existing) return existing;
  const token = crypto.randomUUID();
  window.localStorage.setItem(BROWSER_REQUEST_TOKEN_KEY, token);
  return token;
}
