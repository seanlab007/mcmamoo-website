export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const DEFAULT_OAUTH_PORTAL_URL = "https://auth.mcmamoo.com";
const DEFAULT_APP_ID = "maoai";

// Generate login URL at runtime so redirect URI reflects the current origin.
// dest: optional target page to redirect to after successful login (default: /maoai)
export const getLoginUrl = (dest = "/maoai") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || DEFAULT_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID || DEFAULT_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // state: base64-encoded JSON { redirectUri, dest }
  const state = btoa(JSON.stringify({ redirectUri, dest }));

  const url = new URL("/app-auth", oauthPortalUrl.endsWith("/") ? oauthPortalUrl : `${oauthPortalUrl}/`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
