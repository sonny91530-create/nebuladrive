import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  const where = parentId
    ? and(eq(folders.userId, user.id), eq(folders.parentId, parseInt(parentId)))
    : and(eq(folders.userId, user.id), isNull(folders.parentId));

  const result = await db.select().from(folders).where(where).orderBy(folders.name);
  return NextResponse.json({ folders: result });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { name, parentId } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const folder = await db.insert(folders).values({
    userId: user.id,
    name: name.trim(),
    parentId: parentId || null,
  }).returning();

  return NextResponse.json({ folder: folder[0] }, { status: 201 });
}
