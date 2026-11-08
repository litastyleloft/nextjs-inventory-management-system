import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";

import { auth } from "@/auth";

// auth()'s overloads type this callback form as a route handler; at runtime it is the
// proxy/middleware wrapper, so it is typed as one here.
const authProxy = auth((request) => {
  const isSignedIn = Boolean(request.auth?.user);
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/";
  const isPublicPage = isLoginPage || pathname === "/reset-password";

  if (isLoginPage && isSignedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }
  if (!isPublicPage && !isSignedIn) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
  return NextResponse.next();
}) as unknown as NextMiddleware;

// authjs.session-token, its __Secure- variant, and chunked parts (.0, .1, …).
const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?=/;

/**
 * The Auth.js wrapper re-issues the session cookie on every response it handles. A
 * background request (such as a link prefetch) that is still in flight when the user
 * signs out would then land afterwards and sign them straight back in. So the proxy only
 * reads the session and never writes it; sign-in, sign-out and /api/auth/session set
 * the cookie themselves and are not routed through here.
 */
function withoutSessionCookie(response: Response) {
  const kept = response.headers.getSetCookie().filter((cookie) => !SESSION_COOKIE.test(cookie));
  response.headers.delete("set-cookie");
  for (const cookie of kept) response.headers.append("set-cookie", cookie);
  return response;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await authProxy(request, event);
  return response instanceof Response ? withoutSessionCookie(response) : response;
}

export const config = {
  // Runs on every route except the auth API, Next.js internals and static images.
  matcher: ["/((?!api/auth/|_next/|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
