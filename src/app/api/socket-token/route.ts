import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { CLERK_ENABLED } from "~/lib/auth-mode";

export async function GET() {
  if (CLERK_ENABLED) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const secret = env.SOCKET_SERVER_SECRET ?? "dev-secret";
  return NextResponse.json({ secret });
}
