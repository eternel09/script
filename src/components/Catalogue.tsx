"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, X } from "lucide-react";
import type { PublicTalent, Category } from "@/lib/types";
import { CATEGORIES, categoryLabel } from "@/lib/config";
import { normalizeText, whatsappContactLink } from "@/lib/utils";
import TalentCard, { Avatar } from "./TalentCard";

type Filter = "all" | Category;

export default function Catalogue({ talents }: { talents: PublicTalent[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Filter>("all");

  // Index de recherche précalculé : nom, spécialité, offre, catégorie, quartier.
  const index = useMemo(
    () =>
      talents.map((t) => ({
        t,
        text: normalizeText(
          [t.full_name, t.specialty, t.offer, categoryLabel(t.category), t.category, t.location ?? ""].join(" ")
        ),
      })),
    [talents]
  );

  const results = useMemo(() => {
    const words = normalizeText(q).split(/\s+/).filter(Boolean);
    return index
      .filter(({ t, text }) => (cat === "all" || t.category === cat) && words.every((w) => text.includes(w)))
      .map(({ t }) => t);
  }, [index, q, cat]);

  const featured = talents.slice(0, 3);
  const filtering = q.trim() !== "" || cat !== "all";
  const filters: { value: Filter; label: string }[] = [{ value: "all", label: "Tous" }, ...CATEGORIES];

  return (
    <section aria-labelledby="catalogue-titre" className="mx-auto max-w-6xl px-4">
      <h2 id="catalogue-titre" className="sr-only">
        Catalogue des talents
      </h2>

      {/* Recherche */}
      <div className="relative -mt-7">
        <label htmlFor="recherche" className="sr-only">
          Rechercher un talent
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="recherche"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher : comptable, photographe, Gombe…"
          className="input min-h-[56px] rounded-2xl pl-12 pr-12 shadow-sm"
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:bg-bg"
            aria-label="Effacer la recherche"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div
        className="no-scrollbar relative -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        {filters.map((f) => {
          const active = cat === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setCat(f.value)}
              aria-pressed={active}
              className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                active ? "border-navy bg-navy text-white" : "border-line bg-white text-ink2 hover:border-navy"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm font-semibold text-ink2" aria-live="polite">
        {results.length} talent{results.length > 1 ? "s" : ""}
      </p>

      {/* Mobile : À la une */}
      {!filtering && featured.length > 0 && (
        <div className="mt-4 sm:hidden">
          <h3 className="text-lg font-bold">À la une</h3>
          <div className="no-scrollbar relative -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((t, i) => (
              <div key={t.id} className="w-[80%] max-w-[300px] shrink-0 snap-start">
                <TalentCard t={t} priority={i === 0} />
              </div>
            ))}
          </div>
          {results.length > 0 && <h3 className="mt-6 text-lg font-bold">Tous les talents</h3>}
        </div>
      )}

      {results.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-ink2">
          Aucun talent ne correspond. Essayez un autre mot ou une autre catégorie.
        </div>
      ) : (
        <>
          {/* Mobile : liste compacte */}
          <ul className="mt-3 space-y-2 sm:hidden">
            {results.map((t) => (
              <li key={t.id} className="card flex items-center gap-3 p-2.5">
                <Link href={`/t/${t.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    name={t.full_name}
                    src={t.photo_url}
                    className="h-14 w-14 shrink-0 rounded-xl"
                    sizes="56px"
                    textClass="text-lg"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{t.full_name}</span>
                    <span className="block truncate text-sm text-navy">{t.specialty}</span>
                  </span>
                </Link>
                <a
                  href={whatsappContactLink(t.whatsapp, t.full_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa h-11 w-11 shrink-0 px-0"
                  aria-label={`Contacter ${t.full_name} sur WhatsApp`}
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>

          {/* Tablette et ordinateur : grille */}
          <div className="mt-4 hidden gap-6 sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))" }}>
            {results.map((t, i) => (
              <TalentCard key={t.id} t={t} priority={i < 3} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
