import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import {
  EDIT_COOKIE,
  checkCode,
  clearAttempts,
  countAttempts,
  recordAttempt,
  sign,
} from "@/lib/security";
import { editLoginSchema, firstError } from "@/lib/validation";
import { ADMIN_COLUMNS } from "@/lib/types";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const SESSION_MINUTES = 30;
const DUMMY_HASH = bcrypt.hashSync("dummy-code", 10);

export const POST = handle(async (req: Request) => {
  const parsed = editLoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { whatsapp, code } = parsed.data;

  const failKey = `fail:${whatsapp}`;
  if ((await countAttempts(failKey, LOCK_MINUTES)) >= MAX_FAILS) {
    return fail(`Trop d'essais pour ce numéro. Réessaie dans ${LOCK_MINUTES} minutes.`, 429);
  }

  const { data } = await db()
    .from("talents")
    .select(`${ADMIN_COLUMNS}, edit_code_hash`)
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  const row = data as (Record<string, unknown> & { id: string; edit_code_hash: string }) | null;
  // On compare toujours un hash pour ne pas révéler l'existence du numéro par le temps de réponse.
  const valid = await checkCode(code, row?.edit_code_hash ?? DUMMY_HASH);

  if (!row || !valid) {
    await recordAttempt(failKey);
    const left = MAX_FAILS - (await countAttempts(failKey, LOCK_MINUTES));
    return fail(
      left > 0
        ? `Numéro ou code incorrect. Il te reste ${left} essai${left > 1 ? "s" : ""}.`
        : `Trop d'essais pour ce numéro. Réessaie dans ${LOCK_MINUTES} minutes.`,
      401
    );
  }

  await clearAttempts(failKey);
  cookies().set(EDIT_COOKIE, sign({ id: row.id, exp: Date.now() + SESSION_MINUTES * 60_000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MINUTES * 60,
  });

  const talent: Record<string, unknown> = { ...row };
  delete talent.edit_code_hash;
  return ok({ talent });
});
