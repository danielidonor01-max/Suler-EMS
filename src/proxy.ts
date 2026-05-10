import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/", "/_not-found"].includes(req.nextUrl.pathname);

  // 1. Allow API Auth routes (login/logout/session)
  if (isApiAuthRoute) return NextResponse.next();

  // 2. Redirect logged-in users away from login page
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/employees", req.nextUrl));
  }

  // 3. Protect all other dashboard/API routes
  if (!isLoggedIn && !isAuthPage && !isPublicRoute) {
    let callbackUrl = req.nextUrl.pathname;
    if (req.nextUrl.search) callbackUrl += req.nextUrl.search;
    
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|css|images).*)"],
};
