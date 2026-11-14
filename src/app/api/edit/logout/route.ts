import { cookies } from "next/headers";
import { EDIT_COOKIE } from "@/lib/security";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(EDIT_COOKIE);
  return ok();
}
