import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in production.");
}

const JWT_SECRET = jwtSecretEnv || "marginos-development-secret-key-f&b-2026";
const COOKIE_NAME = "marginos_token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; businessId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string; businessId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        business: {
          include: {
            outlets: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        businessId: user.businessId,
      },
      business: user.business,
    };
  } catch (error) {
    console.error("Session lookup error:", error);
    return null;
  }
}

export { COOKIE_NAME };
