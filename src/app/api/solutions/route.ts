import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deploymentBookmarks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stepIndex, stepTitle, notes, isCompleted } = body;

    if (!stepIndex || !stepTitle) {
      return NextResponse.json({ error: "stepIndex and stepTitle required" }, { status: 400 });
    }

    const bookmark = await db.insert(deploymentBookmarks).values({
      stepIndex,
      stepTitle,
      notes,
      isCompleted: isCompleted ?? false,
    }).returning();

    return NextResponse.json({ bookmark: bookmark[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bookmarks = await db.select().from(deploymentBookmarks).orderBy(deploymentBookmarks.stepIndex);
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, notes, isCompleted } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updateData: { notes?: string; isCompleted?: boolean; updatedAt?: Date } = {
      updatedAt: new Date(),
    };
    if (notes !== undefined) updateData.notes = notes;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const updated = await db
      .update(deploymentBookmarks)
      .set(updateData)
      .where(eq(deploymentBookmarks.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({ bookmark: updated[0] });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}
