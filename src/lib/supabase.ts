import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

/** Client serveur avec la clé service_role. Ne jamais importer côté client. */
export function db(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis."
    );
  }
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const PHOTO_BUCKET = "photos";

/** Extrait le chemin interne au bucket depuis une URL publique. */
export function photoPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function removePhoto(url: string | null) {
  const path = photoPathFromUrl(url);
  if (path) await db().storage.from(PHOTO_BUCKET).remove([path]);
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/webp", "image/jpeg", "image/png"];

/** Envoie une photo (déjà compressée côté client) et renvoie son URL publique. */
export async function uploadPhoto(file: File, slug: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new UserError("Format de photo non accepté.");
  if (file.size > MAX_PHOTO_BYTES) throw new UserError("Photo trop lourde (2 Mo max après compression).");
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${slug}-${Date.now().toString(36)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, buf, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("Envoi de la photo impossible : " + error.message);
  return db().storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Erreur dont le message peut être montré tel quel à l'utilisateur. */
export class UserError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status = 400, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
