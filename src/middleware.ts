import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { CLERK_ENABLED } from "~/lib/auth-mode";
import { env } from "~/env";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default CLERK_ENABLED
  ? clerkMiddleware(
      async (auth, req) => {
        if (!isAdminRoute(req)) return;

        const { userId, redirectToSignIn } = await auth();
        if (!userId) {
          return redirectToSignIn({ returnBackUrl: req.url });
        }
      },
      {
        signInUrl: "/sign-in",
        signUpUrl: "/sign-up",
        ...(env.NEXT_PUBLIC_CLERK_DOMAIN
          ? { domain: env.NEXT_PUBLIC_CLERK_DOMAIN }
          : {}),
      },
    )
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
