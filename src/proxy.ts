import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPaths = ["/dashboard", "/campaigns", "/contributions"];
const authPaths = ["/signin", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPath) return NextResponse.next();

  // Optimistic cookie check only — no network round-trip. The middleware
  // fetching its own public URL per request breaks whenever the host's NAT
  // misbehaves and is slow even when it doesn't. Server pages verify the
  // session for real via auth.api.getSession.
  const sessionCookie = getSessionCookie(request);

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthPath && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
