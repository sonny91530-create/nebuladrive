import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, mot de passe et nom requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit avoir au moins 6 caractères" }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
    }).returning({ id: users.id });

    const userId = result[0].id;
    const token = generateToken(userId);

    return NextResponse.json({
      token,
      user: { id: userId, email: email.toLowerCase().trim(), name: name.trim(), storageUsed: 0, storageLimit: 25 * 1024 * 1024 * 1024 },
    }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
