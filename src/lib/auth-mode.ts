import { env } from "~/env";

// The scaffolded .env ships a placeholder Clerk key so the app can boot
// before a real Clerk account exists. Clerk's SDK throws ("Publishable key
// not valid") on every request when that placeholder is still in place, so
// we skip Clerk entirely in that case and treat requests as an already
// authenticated local admin. The moment a real key is set, this flips back
// on automatically — nothing to remember to revert.
export const CLERK_ENABLED =
  !!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

export const LOCAL_DEV_USER_ID = "local-dev-admin";
