import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Refresh is only session maintenance. All authorization is enforced again in the repository/RLS.
export async function proxy(request: NextRequest) {
  // Password authentication must not wait for an unrelated stale session refresh.
  if (request.nextUrl.pathname.startsWith('/api/auth/')) return NextResponse.next();
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_ANON_KEY;
  const refresh = request.cookies.get("birthday-refresh")?.value;
  if (!url || !key || !refresh) return NextResponse.next();
  const token = request.cookies.get("birthday-token")?.value;
  try {
    if (
      token &&
      JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp >
        Date.now() / 1000 + 90
    )
      return NextResponse.next();
  } catch {}
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.refreshSession({
    refresh_token: refresh,
  });
  if (error || !data.session) {
    const response = NextResponse.next();
    response.cookies.delete("birthday-token");
    response.cookies.delete("birthday-refresh");
    return response;
  }
  request.cookies.set("birthday-token", data.session.access_token);
  request.cookies.set("birthday-refresh", data.session.refresh_token);
  const response = NextResponse.next({ request: { headers: request.headers } });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  response.cookies.set("birthday-token", data.session.access_token, options);
  response.cookies.set("birthday-refresh", data.session.refresh_token, options);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/dashboard/:path*", "/create", "/preview/:path*", "/api/:path*"],
};
