import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./supabase";

// ---------- Codes à 6 chiffres ----------
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}
export function checkCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

// ---------- Jeton d'inscription ----------
export function inscriptionToken(): string {
  return process.env.INSCRIPTION_TOKEN || "";
}
export function isValidInscriptionToken(t: string | null | undefined): boolean {
  const expected = inscriptionToken();
  if (!expected || !t) return false;
  return safeEqual(t, expected);
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ---------- Cookies signés (HMAC) ----------
function secret(): string {
  // Dérivé de secrets serveur existants : pas de variable supplémentaire à gérer.
  const base = (process.env.SUPABASE_SERVICE_ROLE_KEY || "") + "|" + (process.env.ADMIN_PASSWORD || "");
  return createHmac("sha256", "vitrine-des-talents").update(base).digest("hex");
}

/** Signe "payload" ; renvoie "payload.signature" (payload en base64url). */
export function sign(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE = "vt_admin";
export const EDIT_COOKIE = "vt_edit";

// ---------- Limites (stockées dans Postgres, fiables en serverless) ----------
export async function countAttempts(key: string, windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error } = await db()
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function recordAttempt(key: string) {
  await db().from("attempts").insert({ key });
}

export async function clearAttempts(key: string) {
  await db().from("attempts").delete().eq("key", key);
}

/** Nettoyage opportuniste des tentatives de plus de 24 h. */
export async function pruneAttempts() {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  await db().from("attempts").delete().lt("created_at", since);
}

export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "inconnue";
}
