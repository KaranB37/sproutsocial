import { NextResponse } from "next/server";

export function middleware(request) {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set(
      "Access-Control-Allow-Origin",
      "http://localhost:3000"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  const response = NextResponse.next();

  // Add Authorization header to the request
  response.headers.set(
    "Authorization",
    `Bearer ${process.env.NEXT_PUBLIC_SPROUT_API_TOKEN}`
  );
  response.headers.set("Content-Type", "application/json");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
