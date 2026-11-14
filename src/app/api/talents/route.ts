import { revalidatePath } from "next/cache";
import { db, uploadPhoto, removePhoto, UserError } from "@/lib/supabase";
import {
  clientIp,
  countAttempts,
  generateCode,
  hashCode,
  isValidInscriptionToken,
  pruneAttempts,
  recordAttempt,
} from "@/lib/security";
import { createSchema, firstError, formToObject } from "@/lib/validation";
import { makeSlug, moderationOn } from "@/lib/talents";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREATIONS_PER_HOUR = 5;

export const POST = handle(async (req: Request) => {
  const fd = await req.formData();

  if (!isValidInscriptionToken(fd.get("token") as string | null)) {
    return fail("Scanne le QR code officiel de l'événement.", 403);
  }

  // Honeypot : un humain ne remplit jamais ce champ caché. On simule un succès.
  if ((fd.get("website") as string | null)?.trim()) {
    return ok({ code: "000000", slug: "", status: "pending" });
  }

  const parsed = createSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;

  const ipKey = `create:${clientIp(req.headers)}`;
  if ((await countAttempts(ipKey, 60)) >= MAX_CREATIONS_PER_HOUR) {
    return fail("Trop de cartes créées depuis cette connexion. Réessaie dans une heure.", 429);
  }

  const { data: existing } = await db().from("talents").select("id").eq("whatsapp", v.whatsapp).maybeSingle();
  if (existing) {
    throw new UserError("Ce numéro a déjà une carte. Tu peux la modifier avec ton code.", 409, { duplicate: true });
  }

  const slug = makeSlug(v.full_name);
  const photo = fd.get("photo");
  let photo_url: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    photo_url = await uploadPhoto(photo, slug);
  }

  const code = generateCode();
  const status = moderationOn() ? "pending" : "published";

  const { error } = await db().from("talents").insert({
    slug,
    full_name: v.full_name,
    specialty: v.specialty,
    category: v.category,
    offer: v.offer,
    seeking: v.seeking,
    location: v.location,
    whatsapp: v.whatsapp,
    email: v.email,
    link: v.link,
    photo_url,
    consent: true,
    status,
    edit_code_hash: await hashCode(code),
  });

  if (error) {
    await removePhoto(photo_url);
    if (error.code === "23505") {
      throw new UserError("Ce numéro a déjà une carte. Tu peux la modifier avec ton code.", 409, { duplicate: true });
    }
    throw error;
  }

  await recordAttempt(ipKey);
  if (Math.random() < 0.1) pruneAttempts().catch(() => {});
  revalidatePath("/");

  return ok({ code, slug, status });
});
