import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { CLERK_ENABLED } from "~/lib/auth-mode";

const isAdminRoute = createRouteMatcher([
  "/quiz/admin(.*)",
  "/tips/admin(.*)",
]);

export default CLERK_ENABLED
  ? clerkMiddleware(
      async (auth, req) => {
        if (isAdminRoute(req)) {
          await auth.protect();
        }
      },
      {
        // Required while vercel.app remains connected in Clerk Production
        // (Account Portal disabled → app hosts /sign-in and proxies FAPI).
        frontendApiProxy: { enabled: true },
      },
    )
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
