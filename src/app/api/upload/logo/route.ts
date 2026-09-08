import { auth } from "@clerk/nextjs/server";
import { mkdir, writeFile } from "fs/promises";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import path from "path";

import { CLERK_ENABLED, LOCAL_DEV_USER_ID } from "~/lib/auth-mode";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/svg+xml"]);

export async function POST(req: Request) {
  const userId = CLERK_ENABLED
    ? (await auth()).userId
    : LOCAL_DEV_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only PNG or SVG allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max 2MB" }, { status: 400 });
  }

  const ext = file.type === "image/svg+xml" ? "svg" : "png";
  const filename = `${nanoid()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ url: `/uploads/logos/${filename}` });
}
