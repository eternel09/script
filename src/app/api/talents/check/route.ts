import { db } from "@/lib/supabase";
import { isValidInscriptionToken } from "@/lib/security";
import { normalizePhone } from "@/lib/utils";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vérifie, avant l'aperçu, si un numéro possède déjà une carte. */
export const POST = handle(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as { token?: string; whatsapp?: string };
  if (!isValidInscriptionToken(body.token)) return fail("Scanne le QR code officiel de l'événement.", 403);
  const phone = normalizePhone(body.whatsapp ?? "");
  if (!phone) return fail("Numéro WhatsApp invalide (ex. 0812345678).");
  const { data } = await db().from("talents").select("id").eq("whatsapp", phone).maybeSingle();
  return ok({ exists: Boolean(data), whatsapp: phone });
});
