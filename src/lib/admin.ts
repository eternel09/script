import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verify } from "./security";
import { UserError } from "./supabase";

export function isAdmin(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  return Boolean(verify<{ admin: boolean; exp: number }>(cookies().get(ADMIN_COOKIE)?.value)?.admin);
}

export function requireAdmin() {
  if (!isAdmin()) throw new UserError("Accès réservé à l'équipe. Reconnecte-toi.", 401);
}
