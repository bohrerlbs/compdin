import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname.startsWith("/login")

  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token")

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/anvs", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.json|icons|sw\\.js|workbox|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.webp|.*\\.ico).*)",
  ],
}
