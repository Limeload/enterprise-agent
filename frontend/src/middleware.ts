import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/pricing", "/api/auth", "/api/billing/webhook"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public paths and static files
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/braincache")
  ) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
