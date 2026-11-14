import { requireAdmin } from "@/lib/admin";
import { listAll } from "@/lib/talents";
import { categoryLabel } from "@/lib/config";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  ["full_name", "Nom"],
  ["specialty", "Spécialité"],
  ["category", "Catégorie"],
  ["offer", "Ce que je propose"],
  ["seeking", "Ce que je recherche"],
  ["location", "Quartier"],
  ["whatsapp", "WhatsApp"],
  ["email", "E-mail"],
  ["link", "Lien"],
  ["photo_url", "Photo"],
  ["status", "Statut"],
  ["slug", "Slug"],
  ["created_at", "Créée le"],
  ["updated_at", "Modifiée le"],
] as const;

function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Neutralise les formules (injection CSV dans Excel).
  if (/^[=+\-@]/.test(s) && !/^\+\d+$/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export const GET = handle(async () => {
  requireAdmin();
  const rows = await listAll();
  const lines = [COLUMNS.map(([, label]) => cell(label)).join(";")];
  for (const r of rows) {
    lines.push(
      COLUMNS.map(([key]) => cell(key === "category" ? categoryLabel(r.category) : (r as Record<string, unknown>)[key])).join(";")
    );
  }
  // BOM UTF-8 + séparateur ";" : s'ouvre correctement dans Excel en français.
  const csv = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vitrine-des-talents-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
