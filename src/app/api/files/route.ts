import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, folders, users } from "@/db/schema";
import { eq, and, isNull, desc, or, like } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const search = searchParams.get("search");

  let where;
  if (search) {
    where = and(
      eq(files.userId, user.id),
      or(like(files.name, `%${search}%`), like(files.originalName, `%${search}%`))
    );
  } else if (folderId) {
    where = and(eq(files.userId, user.id), eq(files.folderId, parseInt(folderId)));
  } else {
    where = and(eq(files.userId, user.id), isNull(files.folderId));
  }

  // Don't send fileData in list queries (too large)
  const result = await db
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
    .where(where)
    .orderBy(desc(files.createdAt));

  return NextResponse.json({ files: result });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await request.formData();
  const uploadedFiles = formData.getAll("files") as File[];
  const folderIdStr = formData.get("folderId") as string | null;
  const folderId = folderIdStr ? parseInt(folderIdStr) : null;

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  // Check storage limit
  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const [userRecord] = await db
    .select({ storageUsed: users.storageUsed, storageLimit: users.storageLimit })
    .from(users)
    .where(eq(users.id, user.id));
  if (userRecord.storageUsed + totalSize > userRecord.storageLimit) {
    return NextResponse.json({ error: "Espace de stockage insuffisant" }, { status: 413 });
  }

  const savedFiles = [];
  const databaseUrl = process.env.DATABASE_URL || "";
  const isNeon = databaseUrl.includes("neon.tech") || process.env.DB_DRIVER === "neon-http";

  for (const file of uploadedFiles) {
    const ext = path.extname(file.name) || "";
    const uniqueName = `${uuidv4()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let fileData: string | null = null;
    let storagePath = `uploads/${uniqueName}`;

    if (isNeon) {
      // Store file content as base64 in PostgreSQL (for Vercel serverless)
      fileData = buffer.toString("base64");
    } else {
      // Store on disk (local dev)
      const { writeFile } = await import("fs/promises");
      const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
      try {
        await (await import("fs/promises")).mkdir(uploadDir, { recursive: true });
      } catch {}
      await writeFile(path.join(uploadDir, uniqueName), buffer);
    }

    const [saved] = await db
      .insert(files)
      .values({
        userId: user.id,
        folderId: folderId,
        name: uniqueName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        fileData: fileData as any,
      })
      .returning();

    savedFiles.push(saved);
  }

  // Update storage usage
  const total = savedFiles.reduce((s, f) => s + f.size, 0);
  await db
    .update(users)
    .set({ storageUsed: userRecord.storageUsed + total, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Don't send fileData in response
  const response = savedFiles.map(({ fileData, ...rest }: any) => rest);
  return NextResponse.json({ files: response }, { status: 201 });
}
