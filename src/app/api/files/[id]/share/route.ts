import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const fileId = parseInt(id);

  const [file] = await db.select().from(files).where(and(eq(files.id, fileId), eq(files.userId, user.id)));
  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  const shareToken = uuidv4().replace(/-/g, "");
  const [updated] = await db.update(files).set({ shareToken, isPublic: true, updatedAt: new Date() }).where(eq(files.id, fileId)).returning();

  const shareUrl = `/share/${updated.shareToken}`;

  return NextResponse.json({ shareToken: updated.shareToken, shareUrl, file: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const fileId = parseInt(id);

  const [file] = await db.select().from(files).where(and(eq(files.id, fileId), eq(files.userId, user.id)));
  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  const [updated] = await db.update(files).set({ shareToken: null, isPublic: false, updatedAt: new Date() }).where(eq(files.id, fileId)).returning();

  return NextResponse.json({ file: updated });
}
