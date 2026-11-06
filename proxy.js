
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProduction = process.env.NODE_ENV === "production";

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      isProduction ? "" : "'unsafe-eval'"
    }`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ];

  const contentSecurityPolicy = cspDirectives.join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            supabaseResponse = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });

            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if ((error || !user) && pathname !== "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set(
        "Content-Security-Policy",
        contentSecurityPolicy
      );

      return redirectResponse;
    }
  }

  supabaseResponse.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicy
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
