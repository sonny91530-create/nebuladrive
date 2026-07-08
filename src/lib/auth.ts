import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cloud-storage-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<{ id: number; email: string; name: string; storageUsed: number; storageLimit: number } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      storageUsed: users.storageUsed,
      storageLimit: users.storageLimit,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  return user[0] || null;
}
