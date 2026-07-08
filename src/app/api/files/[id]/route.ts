import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = parseInt(id);

  const [file] = await db
    .select({
      id: files.id,
      userId: files.userId,
      folderId: files.folderId,
      name: files.name,
      originalName: files.originalName,
      mimeType: files.mimeType,
      size: files.size,
      storagePath: files.storagePath,
      isPublic: files.isPublic,
      shareToken: files.shareToken,
      downloadCount: files.downloadCount,
      createdAt: files.createdAt,
      updatedAt: files.updatedAt,
    })
    .from(files)
    .where(eq(files.id, fileId));

  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  if (file.isPublic) {
    return NextResponse.json({ file });
  }

  const user = await getUserFromRequest(request);
  if (!user || user.id !== file.userId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ file });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const fileId = parseInt(id);

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  // Try to delete from disk (silent if Neon mode / fileData stored in DB)
  try {
    const { unlink } = await import("fs/promises");
    await unlink(path.join(/*turbopackIgnore: true*/ process.cwd(), file.storagePath));
  } catch {}

  await db.delete(files).where(eq(files.id, fileId));
  await db
    .update(users)
    .set({ storageUsed: Math.max(0, user.storageUsed - file.size), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const fileId = parseInt(id);
  const body = await request.json();

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

  if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.folderId !== undefined) updates.folderId = body.folderId;
  if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

  const [updated] = await db.update(files).set(updates).where(eq(files.id, fileId)).returning();

  // Don't return fileData
  const { fileData: _, ...rest } = updated as any;
  return NextResponse.json({ file: rest });
}
