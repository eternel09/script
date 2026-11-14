import "server-only";
import { NextResponse } from "next/server";
import { UserError } from "./supabase";

export function ok(data: Record<string, unknown> = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Enveloppe une route : les UserError sont renvoyées telles quelles, le reste est masqué. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof UserError) return fail(e.message, e.status, e.extra);
      console.error(e);
      return fail("Une erreur est survenue. Réessaie dans un instant.", 500);
    }
  };
}
