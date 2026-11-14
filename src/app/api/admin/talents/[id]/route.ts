import { revalidatePath } from "next/cache";
import { db, removePhoto, UserError } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { generateCode, hashCode } from "@/lib/security";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "publish" | "hide" | "delete" | "regenerate";

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  requireAdmin();
  const { action } = (await req.json().catch(() => ({}))) as { action?: Action };

  const { data: row } = await db().from("talents").select("id, slug, photo_url").eq("id", params.id).maybeSingle();
  if (!row) throw new UserError("Carte introuvable.", 404);

  let result: Record<string, unknown> = {};
  switch (action) {
    case "publish":
    case "hide": {
      const status = action === "publish" ? "published" : "hidden";
      const { error } = await db().from("talents").update({ status }).eq("id", row.id);
      if (error) throw error;
      result = { status };
      break;
    }
    case "delete": {
      const { error } = await db().from("talents").delete().eq("id", row.id);
      if (error) throw error;
      await removePhoto(row.photo_url);
      break;
    }
    case "regenerate": {
      const code = generateCode();
      const { error } = await db().from("talents").update({ edit_code_hash: await hashCode(code) }).eq("id", row.id);
      if (error) throw error;
      result = { code };
      break;
    }
    default:
      return fail("Action inconnue.");
  }

  revalidatePath("/");
  revalidatePath(`/t/${row.slug}`);
  return ok(result);
});
