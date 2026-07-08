import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = parseInt(id);

  const [file] = await db.select().from(files).where(eq(files.id, fileId));
  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  // Check access: owner via Bearer token OR public OR share token
  let authorized = file.isPublic;

  if (!authorized) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.slice(7));
      if (payload && payload.userId === file.userId) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get("token");
    if (shareToken && file.shareToken === shareToken) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Increment download count
  await db
    .update(files)
    .set({ downloadCount: (file.downloadCount || 0) + 1 })
    .where(eq(files.id, fileId));

  let buffer: Buffer;

  // Try PostgreSQL base64 storage first (Neon/Vercel mode)
  if ((file as any).fileData) {
    buffer = Buffer.from((file as any).fileData, "base64");
  } else {
    // Fallback to disk
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), file.storagePath);
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: "Fichier introuvable sur le disque" }, { status: 404 });
    }
    buffer = await readFile(filePath);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
