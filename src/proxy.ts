import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Project Admin routes
    if (path.startsWith("/admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Protected Seller Dashboard Routes
    if (path.startsWith("/seller")) {
      if (token?.role === "SUPER_ADMIN") {
        return NextResponse.next();
      }
      if (token?.role !== "SELLER") {
        return NextResponse.redirect(new URL("/become-a-seller", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*"],
};
