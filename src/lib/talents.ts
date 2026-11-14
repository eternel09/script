import "server-only";
import { randomBytes } from "crypto";
import { db } from "./supabase";
import { PUBLIC_COLUMNS, ADMIN_COLUMNS, type PublicTalent, type AdminTalent } from "./types";
import { slugify } from "./utils";

export async function listPublished(): Promise<PublicTalent[]> {
  const { data, error } = await db()
    .from("talents")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as unknown as PublicTalent[];
}

export async function getPublishedBySlug(slug: string): Promise<PublicTalent | null> {
  const { data, error } = await db()
    .from("talents")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PublicTalent) ?? null;
}

export async function listAll(): Promise<AdminTalent[]> {
  const { data, error } = await db()
    .from("talents")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as unknown as AdminTalent[];
}

export function makeSlug(fullName: string): string {
  return `${slugify(fullName) || "talent"}-${randomBytes(2).toString("hex")}`;
}

export function moderationOn(): boolean {
  return (process.env.MODERATION || "off").toLowerCase() === "on";
}
