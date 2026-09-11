import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { mkdir, writeFile } from "fs/promises";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import path from "path";

import { CLERK_ENABLED, LOCAL_DEV_USER_ID } from "~/lib/auth-mode";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/svg+xml"]);

function resolveType(file: File): "image/png" | "image/svg+xml" | null {
  if (ALLOWED_TYPES.has(file.type)) {
    return file.type as "image/png" | "image/svg+xml";
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return null;
}

export async function POST(req: Request) {
  try {
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

    const contentType = resolveType(file);
    if (!contentType) {
      return NextResponse.json(
        { error: "Only PNG or SVG allowed" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Max 2MB" }, { status: 400 });
    }

    const ext = contentType === "image/svg+xml" ? "svg" : "png";
    const filename = `${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Production (Vercel): filesystem is read-only — use Blob storage.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`logos/${filename}`, buffer, {
        access: "public",
        contentType,
        addRandomSuffix: false,
      });
      return NextResponse.json({ url: blob.url });
    }

    // Local / self-hosted fallback
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "File upload is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) on the server.",
        },
        { status: 503 },
      );
    }

    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return NextResponse.json({ url: `/uploads/logos/${filename}` });
  } catch (error) {
    console.error("Logo upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
