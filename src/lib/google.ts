import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const getRedirectUri = (): string => {
  return process.env.GOOGLE_REDIRECT_URI ?? `${process.env.AUTH_URL}/api/google/callback`;
};

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth env vars missing");
  }
  return { clientId, clientSecret };
};

export const buildAuthUrl = (state: string): string => {
  const { clientId } = getClient();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
};

export const exchangeCode = async (code: string) => {
  const { clientId, clientSecret } = getClient();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type: string;
  }>;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const { clientId, clientSecret } = getClient();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }
  return res.json() as Promise<{
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type: string;
  }>;
};

export const upsertOAuthToken = async (userId: string, data: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}) => {
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : null;

  return prisma.oAuthToken.upsert({
    where: { provider_userId: { provider: "google", userId } },
    create: {
      provider: "google",
      scope: data.scope,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      userId,
    },
    update: {
      scope: data.scope,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? undefined,
      expiresAt,
      updatedAt: new Date(),
    },
  });
};

export const getValidAccessToken = async (userId: string): Promise<string> => {
  const token = await prisma.oAuthToken.findUnique({
    where: { provider_userId: { provider: "google", userId } },
  });
  if (!token) throw new Error("Google account not connected");

  const needsRefresh = token.expiresAt && token.expiresAt.getTime() - Date.now() < 60_000;
  if (needsRefresh) {
    if (!token.refreshToken) throw new Error("Missing refresh token");
    const refreshed = await refreshAccessToken(token.refreshToken);
    const expiresAt = refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null;
    await prisma.oAuthToken.update({
      where: { provider_userId: { provider: "google", userId } },
      data: {
        accessToken: refreshed.access_token,
        expiresAt,
        updatedAt: new Date(),
      },
    });
    return refreshed.access_token;
  }

  return token.accessToken;
};

export const fetchFreeBusy = async (accessToken: string, timeMin: string, timeMax: string) => {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: "primary" }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google freeBusy failed: ${text}`);
  }
  const data = (await res.json()) as {
    calendars: { [key: string]: { busy: { start: string; end: string }[] } };
  };
  return data.calendars?.primary?.busy ?? [];
};
