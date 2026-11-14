"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, Loader2, LogOut, Trash2 } from "lucide-react";
import TalentForm, { type FormValues, type PhotoState } from "./TalentForm";
import type { AdminTalent } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  published: "Visible dans la Vitrine",
  pending: "En attente de validation",
  hidden: "Masquée par l'équipe",
};

export default function EditFlow({ contact, contactHref }: { contact: string; contactHref: string | null }) {
  const [talent, setTalent] = useState<AdminTalent | null>(null);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-wa" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Ta carte a été retirée</h2>
        <p className="mt-2 text-ink2">Elle et sa photo ont été supprimées définitivement.</p>
        <Link href="/" className="btn-primary mt-5">Retour à la Vitrine</Link>
      </div>
    );
  }

  if (!talent) return <Login onLogin={setTalent} contact={contact} contactHref={contactHref} />;
  return <Editor talent={talent} onSaved={setTalent} onDeleted={() => setDeleted(true)} onLogout={() => setTalent(null)} />;
}

function Login({ onLogin, contact, contactHref }: { onLogin: (t: AdminTalent) => void; contact: string; contactHref: string | null }) {
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/edit/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, code }),
      });
      const j = await r.json();
      if (!j.ok) return setError(j.error);
      onLogin(j.talent);
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div>
        <label htmlFor="wa" className="field-label">Numéro WhatsApp</label>
        <input id="wa" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex. 0812345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="code" className="field-label">Code à 6 chiffres</label>
        <input
          id="code"
          className="input text-center font-display text-2xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-[#E4B4B4] bg-[#FDF2F2] p-3 text-[15px] text-[#7F1D1D]">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6 || !whatsapp}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Accéder à ma carte
      </button>
      <p className="text-sm text-ink2">
        Code perdu ? Contacte l&apos;équipe :{" "}
        {contactHref ? (
          <a href={contactHref} className="font-semibold text-navy underline underline-offset-2">{contact}</a>
        ) : (
          <strong>{contact}</strong>
        )}
      </p>
    </form>
  );
}

function Editor({
  talent,
  onSaved,
  onDeleted,
  onLogout,
}: {
  talent: AdminTalent;
  onSaved: (t: AdminTalent) => void;
  onDeleted: () => void;
  onLogout: () => void;
}) {
  const initial = useMemo<FormValues>(
    () => ({
      full_name: talent.full_name,
      specialty: talent.specialty,
      category: talent.category,
      offer: talent.offer,
      seeking: talent.seeking ?? "",
      location: talent.location ?? "",
      whatsapp: talent.whatsapp,
      email: talent.email ?? "",
      link: talent.link ?? "",
    }),
    [talent]
  );
  const [photo, setPhoto] = useState<PhotoState>({ file: null, previewUrl: talent.photo_url, removed: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function save(v: FormValues) {
    setBusy(true);
    setError(null);
    setSaved(false);
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => k !== "whatsapp" && fd.append(k, val));
    if (photo.file) fd.append("photo", photo.file);
    if (photo.removed && !photo.file) fd.append("remove_photo", "true");
    try {
      const r = await fetch("/api/edit", { method: "PUT", body: fd });
      const j = await r.json();
      if (!j.ok) {
        if (r.status === 401) onLogout();
        return setError(j.error);
      }
      onSaved(j.talent);
      setPhoto({ file: null, previewUrl: j.talent.photo_url, removed: false });
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/edit", { method: "DELETE" });
      const j = await r.json();
      if (!j.ok) {
        if (r.status === 401) onLogout();
        return setError(j.error);
      }
      onDeleted();
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/edit/logout", { method: "POST" }).catch(() => {});
    onLogout();
  }

  return (
    <div>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-semibold">{formatPhone(talent.whatsapp)}</p>
          <p className="text-sm text-ink2">{STATUS_LABEL[talent.status] ?? talent.status}</p>
        </div>
        <div className="flex gap-2">
          {talent.status === "published" && (
            <Link href={`/t/${talent.slug}`} className="btn-outline">
              <Eye className="h-5 w-5" aria-hidden /> Voir
            </Link>
          )}
          <button type="button" className="btn-ghost" onClick={logout}>
            <LogOut className="h-5 w-5" aria-hidden /> Quitter
          </button>
        </div>
      </div>

      {saved && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-[#DDEFE3] p-3 font-semibold text-[#14532D]">
          <CheckCircle2 className="h-5 w-5" aria-hidden /> Modifications enregistrées.
        </p>
      )}

      <div className="mt-5">
        <TalentForm
          initial={initial}
          photo={photo}
          onPhotoChange={setPhoto}
          mode="edit"
          submitLabel="Enregistrer"
          busy={busy}
          serverError={error}
          onSubmit={save}
        />
      </div>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="retirer-titre">
        <h2 id="retirer-titre" className="text-lg font-bold">Retirer ma carte</h2>
        <p className="mt-1 text-[15px] text-ink2">La carte et sa photo seront supprimées définitivement.</p>
        {!confirming ? (
          <button type="button" className="btn-danger mt-3 w-full" onClick={() => setConfirming(true)} disabled={busy}>
            <Trash2 className="h-5 w-5" aria-hidden /> Retirer ma carte
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E4B4B4] bg-[#FDF2F2] p-4" role="alertdialog" aria-labelledby="confirm-txt">
            <p id="confirm-txt" className="font-semibold text-[#7F1D1D]">Confirmer la suppression définitive ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline" onClick={() => setConfirming(false)} disabled={busy}>Annuler</button>
              <button type="button" className="btn bg-[#9B1C1C] text-white hover:bg-[#7F1D1D]" onClick={remove} disabled={busy}>
                {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Oui, supprimer
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
