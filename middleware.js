import { NextResponse } from "next/server";

export function middleware(request) {
  // You can remove or comment out the authentication checks
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
  ],
};
