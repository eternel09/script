"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Eye, EyeOff, KeyRound, Loader2, LogOut, QrCode, Search, Trash2, Database } from "lucide-react";
import type { AdminTalent } from "@/lib/types";
import { categoryLabel } from "@/lib/config";
import { formatPhone, normalizeText } from "@/lib/utils";
import { Avatar } from "./TalentCard";

const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: "Publiée", cls: "bg-[#DDEFE3] text-[#14532D]" },
  pending: { label: "En attente", cls: "bg-[#FBE3CF] text-[#5C2C06]" },
  hidden: { label: "Masquée", cls: "bg-line text-ink2" },
};

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json();
      if (!j.ok) return setError(j.error);
      router.refresh();
    } catch {
      setError("Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-5 space-y-4 p-5">
      {!configured && <p className="font-semibold text-[#9B1C1C]">ADMIN_PASSWORD n&apos;est pas configuré sur le serveur.</p>}
      <div>
        <label htmlFor="pwd" className="field-label">Mot de passe</label>
        <input id="pwd" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </div>
      {error && <p role="alert" className="text-[15px] font-semibold text-[#9B1C1C]">{error}</p>}
      <button className="btn-primary w-full" disabled={busy || !password}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Se connecter
      </button>
    </form>
  );
}

export function AdminPanel({
  talents,
  error,
  moderation,
  seedDemo,
}: {
  talents: AdminTalent[];
  error: string | null;
  moderation: boolean;
  seedDemo: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "pending" | "hidden">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<React.ReactNode>(null);

  const counts = useMemo(() => {
    const c = { all: talents.length, published: 0, pending: 0, hidden: 0 };
    talents.forEach((t) => (c[t.status] += 1));
    return c;
  }, [talents]);

  const rows = useMemo(() => {
    const words = normalizeText(q).split(/\s+/).filter(Boolean);
    return talents.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      const text = normalizeText(`${t.full_name} ${t.specialty} ${t.whatsapp} ${t.location ?? ""}`);
      return words.every((w) => text.includes(w));
    });
  }, [talents, q, status]);

  async function act(t: AdminTalent, action: "publish" | "hide" | "delete" | "regenerate") {
    if (action === "delete" && !confirm(`Supprimer définitivement la carte de ${t.full_name} ?`)) return;
    if (action === "regenerate" && !confirm(`Générer un nouveau code pour ${t.full_name} ? L'ancien ne fonctionnera plus.`)) return;
    setBusyId(t.id);
    setNotice(null);
    try {
      const r = await fetch(`/api/admin/talents/${t.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!j.ok) {
        if (r.status === 401) router.refresh();
        setNotice(<span className="text-[#9B1C1C]">{j.error}</span>);
        return;
      }
      if (action === "regenerate") {
        setNotice(
          <span>
            Nouveau code pour <strong>{t.full_name}</strong> ({formatPhone(t.whatsapp)}) :{" "}
            <strong className="font-display text-2xl tracking-[0.2em]">{j.code}</strong>
            <br />
            <span className="text-sm text-ink2">Transmets-le au membre maintenant : il ne sera plus affiché.</span>
          </span>
        );
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function demo(action: "seed" | "clear") {
    if (action === "clear" && !confirm("Supprimer tous les profils de démonstration ?")) return;
    setBusyId("demo");
    try {
      const r = await fetch("/api/admin/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      setNotice(
        j.ok
          ? action === "seed"
            ? `${j.count} profils de démonstration insérés.`
            : `${j.count} profils de démonstration supprimés.`
          : <span className="text-[#9B1C1C]">{j.error}</span>
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const demoCount = talents.filter((t) => t.is_demo).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-ink2">
            {counts.all} cartes · {counts.published} publiées · {counts.pending} en attente · {counts.hidden} masquées · Modération{" "}
            <strong>{moderation ? "activée" : "désactivée"}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/qr" className="btn-accent"><QrCode className="h-5 w-5" aria-hidden /> Affiche QR</Link>
          <a href="/api/admin/export" className="btn-outline"><Download className="h-5 w-5" aria-hidden /> Export CSV</a>
          <button type="button" onClick={logout} className="btn-ghost"><LogOut className="h-5 w-5" aria-hidden /> Déconnexion</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-[#FDF2F2] p-3 font-semibold text-[#9B1C1C]">{error}</p>}
      {notice && <div role="status" className="card mt-4 border-accent p-4">{notice}</div>}

      <div className="card mt-4 flex flex-wrap items-center gap-2 p-3 text-sm">
        <Database className="h-5 w-5 text-muted" aria-hidden />
        <span className="mr-auto text-ink2">Profils de démonstration : {demoCount}</span>
        {seedDemo && (
          <button type="button" className="btn-outline" onClick={() => demo("seed")} disabled={busyId === "demo"}>Insérer la démo</button>
        )}
        <button type="button" className="btn-danger" onClick={() => demo("clear")} disabled={busyId === "demo" || demoCount === 0}>Vider la démo</button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="adm-q" className="sr-only">Rechercher</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
          <input id="adm-q" type="search" className="input pl-10" placeholder="Nom, spécialité, numéro…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label htmlFor="adm-status" className="sr-only">Statut</label>
        <select id="adm-status" className="input sm:w-56" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Tous les statuts ({counts.all})</option>
          <option value="published">Publiées ({counts.published})</option>
          <option value="pending">En attente ({counts.pending})</option>
          <option value="hidden">Masquées ({counts.hidden})</option>
        </select>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="p-3">Photo</th>
              <th scope="col" className="p-3">Nom</th>
              <th scope="col" className="p-3">Spécialité</th>
              <th scope="col" className="p-3">Catégorie</th>
              <th scope="col" className="p-3">WhatsApp</th>
              <th scope="col" className="p-3">Statut</th>
              <th scope="col" className="p-3">Date</th>
              <th scope="col" className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-ink2">Aucune carte.</td></tr>
            )}
            {rows.map((t) => {
              const busy = busyId === t.id;
              return (
                <tr key={t.id} className="align-middle">
                  <td className="p-3">
                    <Avatar name={t.full_name} src={t.photo_url} className="h-11 w-11 rounded-lg" sizes="44px" textClass="text-sm" />
                  </td>
                  <td className="p-3 font-semibold">
                    {t.status === "published" ? (
                      <Link href={`/t/${t.slug}`} className="text-navy underline-offset-2 hover:underline">{t.full_name}</Link>
                    ) : t.full_name}
                    {t.is_demo && <span className="pill ml-2 bg-line text-ink2">démo</span>}
                  </td>
                  <td className="p-3 text-ink2">{t.specialty}</td>
                  <td className="p-3 text-ink2">{categoryLabel(t.category)}</td>
                  <td className="whitespace-nowrap p-3 text-ink2">{formatPhone(t.whatsapp)}</td>
                  <td className="p-3"><span className={`pill ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span></td>
                  <td className="whitespace-nowrap p-3 text-ink2">{new Date(t.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {busy && <Loader2 className="m-3 h-5 w-5 animate-spin text-muted" aria-label="En cours" />}
                      {t.status !== "published" ? (
                        <button type="button" className="btn-outline px-3 text-sm" onClick={() => act(t, "publish")} disabled={busy}>
                          <Eye className="h-4 w-4" aria-hidden /> Publier
                        </button>
                      ) : (
                        <button type="button" className="btn-outline px-3 text-sm" onClick={() => act(t, "hide")} disabled={busy}>
                          <EyeOff className="h-4 w-4" aria-hidden /> Masquer
                        </button>
                      )}
                      <button type="button" className="btn-outline px-3" onClick={() => act(t, "regenerate")} disabled={busy} aria-label={`Régénérer le code de ${t.full_name}`} title="Régénérer le code">
                        <KeyRound className="h-4 w-4" aria-hidden />
                      </button>
                      <button type="button" className="btn-danger px-3" onClick={() => act(t, "delete")} disabled={busy} aria-label={`Supprimer la carte de ${t.full_name}`} title="Supprimer">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
