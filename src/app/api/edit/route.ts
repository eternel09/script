import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, removePhoto, uploadPhoto, UserError } from "@/lib/supabase";
import { EDIT_COOKIE, verify } from "@/lib/security";
import { firstError, formToObject, talentFields } from "@/lib/validation";
import { ADMIN_COLUMNS } from "@/lib/types";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionId(): string {
  const s = verify<{ id: string; exp: number }>(cookies().get(EDIT_COOKIE)?.value);
  if (!s) throw new UserError("Ta session a expiré. Saisis à nouveau ton numéro et ton code.", 401);
  return s.id;
}

async function current(id: string) {
  const { data, error } = await db().from("talents").select("id, slug, photo_url").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new UserError("Carte introuvable.", 404);
  return data as { id: string; slug: string; photo_url: string | null };
}

export const PUT = handle(async (req: Request) => {
  const id = sessionId();
  const row = await current(id);
  const fd = await req.formData();
  const parsed = talentFields.safeParse(formToObject(fd));
  if (!parsed.success) return fail(firstError(parsed.error));

  let photo_url = row.photo_url;
  const photo = fd.get("photo");
  const removeRequested = fd.get("remove_photo") === "true";
  let oldToDelete: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    photo_url = await uploadPhoto(photo, row.slug);
    oldToDelete = row.photo_url;
  } else if (removeRequested) {
    photo_url = null;
    oldToDelete = row.photo_url;
  }

  const { data, error } = await db()
    .from("talents")
    .update({ ...parsed.data, photo_url })
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();
  if (error) throw error;
  if (oldToDelete) await removePhoto(oldToDelete);

  revalidatePath("/");
  revalidatePath(`/t/${row.slug}`);
  return ok({ talent: data });
});

export const DELETE = handle(async () => {
  const id = sessionId();
  const row = await current(id);
  const { error } = await db().from("talents").delete().eq("id", id);
  if (error) throw error;
  await removePhoto(row.photo_url);
  cookies().delete(EDIT_COOKIE);
  revalidatePath("/");
  revalidatePath(`/t/${row.slug}`);
  return ok();
});
