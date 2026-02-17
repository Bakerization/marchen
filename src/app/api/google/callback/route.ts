import { NextResponse } from "next/server";
import { exchangeCode, upsertOAuthToken } from "@/lib/google";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";

export async function GET(request: Request) {
  const user = await requireAuth();
  requireOrganizer(user);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/dashboard?google_error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`/dashboard?google_error=missing_code_state`);
  }

  const cookieState = request.headers.get("cookie")?.match(/google_oauth_state=([^;]+)/)?.[1];
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL(`/dashboard?google_error=state_mismatch`, request.url));
  }

  try {
    const token = await exchangeCode(code);
    await upsertOAuthToken(user.id, token);
    const res = NextResponse.redirect(new URL(`/dashboard?google_connected=1`, request.url));
    res.cookies.delete("google_oauth_state");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    return NextResponse.redirect(
      new URL(`/dashboard?google_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
