"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, KeyRound, Loader2, MessageCircle, Pencil, Send, Share2 } from "lucide-react";
import TalentForm, { EMPTY_VALUES, type FormValues, type PhotoState } from "./TalentForm";
import TalentCard from "./TalentCard";
import type { Category } from "@/lib/types";
import { digitsOnly, normalizePhone, normalizeUrl } from "@/lib/utils";

type Step = "form" | "preview" | "done";
type Result = { code: string; slug: string; status: "published" | "pending" };

const DUPLICATE = (
  <>
    Ce numéro a déjà une carte.{" "}
    <Link href="/modifier" className="font-semibold underline underline-offset-2">
      Modifier ma carte avec mon code
    </Link>
  </>
);

export default function InscriptionFlow({ token, siteUrl }: { token: string; siteUrl: string }) {
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [photo, setPhoto] = useState<PhotoState>({ file: null, previewUrl: null, removed: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<React.ReactNode>(null);
  const [honeypot, setHoneypot] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  async function toPreview(v: FormValues) {
    setValues(v);
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/talents/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, whatsapp: v.whatsapp }),
      });
      const j = await r.json();
      if (!j.ok) return setError(j.error);
      if (j.exists) return setError(DUPLICATE);
      setStep("preview");
      top();
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    Object.entries(values).forEach(([k, val]) => fd.append(k, val));
    fd.append("consent", "true");
    fd.append("token", token);
    fd.append("website", honeypot);
    if (photo.file) fd.append("photo", photo.file);
    try {
      const r = await fetch("/api/talents", { method: "POST", body: fd });
      const j = await r.json();
      if (!j.ok) {
        setError(j.duplicate ? DUPLICATE : j.error);
        return;
      }
      setResult({ code: j.code, slug: j.slug, status: j.status });
      setStep("done");
      top();
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  const stepNo = step === "form" ? 1 : step === "preview" ? 2 : 3;

  return (
    <div>
      <ol className="mb-6 flex items-center gap-2 text-sm font-semibold" aria-label="Étapes">
        {["Ta carte", "Aperçu", "Ton code"].map((label, i) => {
          const n = i + 1;
          const active = n === stepNo;
          const done = n < stepNo;
          return (
            <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  active ? "bg-accent text-white" : done ? "bg-navy text-white" : "bg-line text-ink2"
                }`}
              >
                {n}
              </span>
              <span className={active ? "text-ink" : "text-muted"}>{label}</span>
            </li>
          );
        })}
      </ol>

      {step === "form" && (
        <>
          {/* Honeypot : invisible pour les humains */}
          <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="website">Site web</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <TalentForm
            initial={values}
            photo={photo}
            onPhotoChange={setPhoto}
            mode="create"
            submitLabel="Voir l'aperçu"
            busy={busy}
            serverError={error}
            onSubmit={toPreview}
          />
        </>
      )}

      {step === "preview" && (
        <div>
          <h2 className="text-xl font-bold">Voici ta carte</h2>
          <p className="mt-1 text-ink2">Elle apparaîtra exactement ainsi dans la Vitrine.</p>
          <div className="mx-auto mt-4 max-w-[340px]">
            <TalentCard
              preview
              unoptimized
              t={{
                slug: "apercu",
                full_name: values.full_name.trim(),
                specialty: values.specialty.trim(),
                category: values.category as Category,
                offer: values.offer.trim(),
                location: values.location.trim() || null,
                whatsapp: normalizePhone(values.whatsapp) ?? values.whatsapp,
                email: values.email.trim() || null,
                photo_url: photo.previewUrl,
              }}
            />
          </div>
          {values.link && <p className="mt-3 text-center text-sm text-muted">Lien : {normalizeUrl(values.link)}</p>}
          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-[#E4B4B4] bg-[#FDF2F2] p-3.5 text-[15px] text-[#7F1D1D]">
              {error}
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn-outline" onClick={() => { setError(null); setStep("form"); }} disabled={busy}>
              <Pencil className="h-5 w-5" aria-hidden /> Modifier
            </button>
            <button type="button" className="btn-accent" onClick={publish} disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
              Publier ma carte
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && <Done result={result} values={values} siteUrl={siteUrl} />}
    </div>
  );
}

function Done({ result, values, siteUrl }: { result: Result; values: FormValues; siteUrl: string }) {
  const phone = normalizePhone(values.whatsapp) ?? values.whatsapp;
  const profileUrl = `${siteUrl}/t/${result.slug}`;
  const selfMsg =
    `Vitrine des Talents : mon code secret est ${result.code}. ` +
    `Il me permet de modifier ou retirer ma carte ici : ${siteUrl}/modifier (numéro ${phone}).`;
  const shareMsg = `Découvre ma carte sur la Vitrine des Talents : ${profileUrl}`;
  const published = result.status === "published";

  return (
    <div>
      <h2 className="text-2xl font-bold">{published ? "Ta carte est en ligne !" : "Ta carte est enregistrée"}</h2>
      {!published && (
        <p className="mt-2 rounded-xl bg-[#FBE3CF] p-3 text-[15px] text-[#5C2C06]">
          Ta carte sera visible après validation par l&apos;équipe.
        </p>
      )}

      <section className="card mt-5 border-2 border-accent p-5 text-center" aria-labelledby="code-titre">
        <p id="code-titre" className="flex items-center justify-center gap-2 font-semibold text-ink2">
          <KeyRound className="h-5 w-5" aria-hidden /> Ton code secret
        </p>
        <p className="mt-2 font-display text-5xl font-bold tracking-[0.2em] text-ink" aria-label={`Code : ${result.code.split("").join(" ")}`}>
          {result.code}
        </p>
        <p className="mt-3 text-[15px] text-ink2">
          <strong>Note-le maintenant.</strong> Il ne sera plus jamais affiché. Avec ton numéro WhatsApp, il te permet de modifier ou retirer ta carte.
        </p>
        <a
          href={`https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(selfMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa mt-4 w-full"
        >
          <MessageCircle className="h-5 w-5" aria-hidden /> M&apos;envoyer le code sur WhatsApp
        </a>
      </section>

      {published && (
        <>
          <section className="card mt-5 flex flex-col items-center p-5 text-center">
            <h3 className="font-bold">Ton QR personnel</h3>
            <p className="text-sm text-ink2">Il mène directement à ta carte.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/qr/${result.slug}`} alt="QR code de ta carte" width={180} height={180} className="mt-3 h-[180px] w-[180px]" />
            <a href={`/api/qr/${result.slug}?download`} download className="btn-outline mt-3">
              <Download className="h-5 w-5" aria-hidden /> Télécharger en PNG
            </a>
          </section>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href={`/t/${result.slug}`} className="btn-primary">
              <Eye className="h-5 w-5" aria-hidden /> Voir ma carte dans la Vitrine
            </Link>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`} target="_blank" rel="noopener noreferrer" className="btn-wa">
              <Share2 className="h-5 w-5" aria-hidden /> Partager sur WhatsApp
            </a>
          </div>
        </>
      )}

      <Link href="/" className="btn-ghost mt-4 w-full">
        <ArrowLeft className="h-5 w-5" aria-hidden /> Retour à la Vitrine
      </Link>
    </div>
  );
}
