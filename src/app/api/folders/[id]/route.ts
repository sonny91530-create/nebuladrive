import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders, files } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const folderId = parseInt(id);

  const folder = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
    .limit(1);

  if (folder.length === 0) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  // Get all files recursively to attempt disk cleanup (silent if Neon/DB mode)
  async function getFilesInFolder(fid: number): Promise<(typeof files.$inferSelect)[]> {
    const direct = await db.select().from(files).where(eq(files.folderId, fid));
    const subFolders = await db.select().from(folders).where(eq(folders.parentId, fid));
    let allFiles = [...direct];
    for (const sf of subFolders) {
      allFiles = allFiles.concat(await getFilesInFolder(sf.id));
    }
    return allFiles;
  }

  const allFiles = await getFilesInFolder(folderId);
  for (const f of allFiles) {
    try {
      const { unlink } = await import("fs/promises");
      await unlink(path.join(/*turbopackIgnore: true*/ process.cwd(), f.storagePath));
    } catch {}
  }

  await db.delete(folders).where(eq(folders.id, folderId));
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const folderId = parseInt(id);
  const { name } = await request.json();

  const folder = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
    .limit(1);

  if (folder.length === 0) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const updated = await db
    .update(folders)
    .set({ name: name?.trim() || folder[0].name, updatedAt: new Date() })
    .where(eq(folders.id, folderId))
    .returning();

  return NextResponse.json({ folder: updated[0] });
}
