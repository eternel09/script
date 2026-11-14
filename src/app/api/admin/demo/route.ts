import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { DEMO_TALENTS, seedDemoEnabled } from "@/lib/demo";
import { generateCode, hashCode } from "@/lib/security";
import { makeSlug } from "@/lib/talents";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  requireAdmin();
  const { action } = (await req.json().catch(() => ({}))) as { action?: "seed" | "clear" };

  if (action === "clear") {
    const { error, count } = await db().from("talents").delete({ count: "exact" }).eq("is_demo", true);
    if (error) throw error;
    revalidatePath("/");
    return ok({ count: count ?? 0 });
  }

  if (action === "seed") {
    if (!seedDemoEnabled()) return fail("Passe SEED_DEMO=true pour insérer les profils de démonstration.");
    const hash = await hashCode(generateCode()); // code inconnu : profils non modifiables par le public
    const rows = DEMO_TALENTS.map((t, i) => ({
      ...t,
      seeking: t.seeking ?? null,
      location: t.location ?? null,
      slug: makeSlug(t.full_name),
      whatsapp: `+24399000000${i + 1}`,
      consent: true,
      status: "published",
      is_demo: true,
      edit_code_hash: hash,
    }));
    const { error, count } = await db()
      .from("talents")
      .upsert(rows, { onConflict: "whatsapp", ignoreDuplicates: true, count: "exact" });
    if (error) throw error;
    revalidatePath("/");
    return ok({ count: count ?? rows.length });
  }

  return fail("Action inconnue.");
});
