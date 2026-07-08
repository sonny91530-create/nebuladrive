import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        storageUsed: users.storageUsed,
        storageLimit: users.storageLimit,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const user = result[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const token = generateToken(user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
