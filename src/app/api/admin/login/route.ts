import { cookies } from "next/headers";
import { ADMIN_COOKIE, clientIp, countAttempts, recordAttempt, safeEqual, sign } from "@/lib/security";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOURS = 12;

export const POST = handle(async (req: Request) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return fail("ADMIN_PASSWORD n'est pas configuré sur le serveur.", 500);

  const key = `admin:${clientIp(req.headers)}`;
  if ((await countAttempts(key, 15)) >= 10) return fail("Trop d'essais. Réessaie dans 15 minutes.", 429);

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !safeEqual(password, expected)) {
    await recordAttempt(key);
    return fail("Mot de passe incorrect.", 401);
  }

  cookies().set(ADMIN_COOKIE, sign({ admin: true, exp: Date.now() + HOURS * 3600_000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HOURS * 3600,
  });
  return ok();
});
