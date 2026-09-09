import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function safeInternalPath(redirectUrl: string | undefined, origin: string) {
  if (!redirectUrl) return "/admin";
  try {
    const parsed = new URL(redirectUrl, origin);
    if (parsed.origin !== new URL(origin).origin) return "/admin";
    return `${parsed.pathname}${parsed.search}` || "/admin";
  } catch {
    return "/admin";
  }
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { userId } = await auth();
  const params = await searchParams;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "robinsundman.se";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const afterSignUp = safeInternalPath(params.redirect_url, origin);

  if (userId) {
    redirect(afterSignUp);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={afterSignUp}
        fallbackRedirectUrl={afterSignUp}
      />
    </main>
  );
}
