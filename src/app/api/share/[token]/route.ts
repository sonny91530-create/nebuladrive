import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [file] = await db.select({
    id: files.id,
    originalName: files.originalName,
    mimeType: files.mimeType,
    size: files.size,
    shareToken: files.shareToken,
    createdAt: files.createdAt,
  }).from(files).where(eq(files.shareToken, token));

  if (!file) {
    return NextResponse.json({ error: "Lien de partage invalide ou expiré" }, { status: 404 });
  }

  return NextResponse.json({ file });
}
