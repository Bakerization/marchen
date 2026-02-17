import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import crypto from "node:crypto";

export async function GET() {
  const user = await requireAuth();
  requireOrganizer(user);

  const state = crypto.randomUUID();
  const url = buildAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
