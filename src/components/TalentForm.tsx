"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/config";
import { talentFields, whatsappField } from "@/lib/validation";
import { z } from "zod";

export type FormValues = {
  full_name: string;
  specialty: string;
  category: string;
  offer: string;
  seeking: string;
  location: string;
  whatsapp: string;
  email: string;
  link: string;
};

export const EMPTY_VALUES: FormValues = {
  full_name: "",
  specialty: "",
  category: "",
  offer: "",
  seeking: "",
  location: "",
  whatsapp: "",
  email: "",
  link: "",
};

export type PhotoState = {
  file: File | null; // nouvelle photo compressée
  previewUrl: string | null; // URL à afficher (blob ou URL existante)
  removed: boolean; // l'utilisateur a retiré la photo existante
};

type Errors = Partial<Record<keyof FormValues | "consent" | "photo", string>>;

const MAX_INPUT_BYTES = 5 * 1024 * 1024;

async function compress(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  const base = { maxWidthOrHeight: 800, maxSizeMB: 0.35, useWebWorker: true, initialQuality: 0.8 };
  let out = await imageCompression(file, { ...base, fileType: "image/webp" });
  // Anciens iPhone : pas d'encodage WebP, on retombe sur du JPEG.
  if (out.type !== "image/webp") out = await imageCompression(file, { ...base, fileType: "image/jpeg" });
  const ext = out.type === "image/webp" ? "webp" : "jpg";
  return new File([out], `photo.${ext}`, { type: out.type });
}

export default function TalentForm({
  initial,
  photo,
  onPhotoChange,
  mode,
  submitLabel,
  busy,
  serverError,
  onSubmit,
}: {
  initial: FormValues;
  photo: PhotoState;
  onPhotoChange: (p: PhotoState) => void;
  mode: "create" | "edit";
  submitLabel: string;
  busy?: boolean;
  serverError?: React.ReactNode;
  onSubmit: (values: FormValues) => void;
}) {
  const [v, setV] = useState<FormValues>(initial);
  const [consent, setConsent] = useState(mode === "edit");
  const [errors, setErrors] = useState<Errors>({});
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setV(initial), [initial]);

  const set = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((x) => ({ ...x, photo: "Choisis une image." }));
      return;
    }
    if (f.size > MAX_INPUT_BYTES) {
      setErrors((x) => ({ ...x, photo: "Photo trop lourde (5 Mo maximum)." }));
      return;
    }
    setErrors((x) => ({ ...x, photo: undefined }));
    setCompressing(true);
    try {
      const out = await compress(f);
      if (photo.file && photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      onPhotoChange({ file: out, previewUrl: URL.createObjectURL(out), removed: false });
    } catch {
      setErrors((x) => ({ ...x, photo: "Impossible de lire cette photo. Essaie une autre image." }));
    } finally {
      setCompressing(false);
    }
  }

  function removePhoto() {
    if (photo.file && photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    onPhotoChange({ file: null, previewUrl: null, removed: true });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const schema = mode === "create" ? talentFields.extend({ whatsapp: whatsappField }) : talentFields;
    const res = schema.safeParse(v);
    const errs: Errors = {};
    if (!res.success) {
      for (const issue of (res.error as z.ZodError).issues) {
        const k = issue.path[0] as keyof Errors;
        if (k && !errs[k]) errs[k] = issue.message;
      }
    }
    if (mode === "create" && !consent) errs.consent = "Coche cette case pour pouvoir publier ta carte.";
    setErrors(errs);
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    onSubmit(v);
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-sm font-semibold text-[#9B1C1C]">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Errors) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      {/* Photo */}
      <div>
        <span className="field-label">Photo (facultative mais encouragée)</span>
        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#C9D2DE] bg-white">
            {compressing ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted" aria-label="Compression en cours" />
            ) : photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="Aperçu de ta photo" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-muted" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()} disabled={compressing}>
              <ImagePlus className="h-5 w-5" aria-hidden /> {photo.previewUrl ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {photo.previewUrl && (
              <button type="button" className="btn-ghost text-sm" onClick={removePhoto}>
                <Trash2 className="h-4 w-4" aria-hidden /> Retirer la photo
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={pickPhoto}
            aria-label="Choisir une photo (appareil photo ou galerie)"
            tabIndex={-1}
          />
        </div>
        <p className="field-help">Appareil photo ou galerie. Un portrait net, de face, fait la différence.</p>
        {err("photo")}
      </div>

      <div>
        <label htmlFor="full_name" className="field-label">Nom complet</label>
        <input id="full_name" name="full_name" className="input" value={v.full_name} onChange={set("full_name")} autoComplete="name" maxLength={80} required {...aria("full_name")} />
        {err("full_name")}
      </div>

      <div>
        <label htmlFor="specialty" className="field-label">Spécialité</label>
        <input id="specialty" name="specialty" className="input" value={v.specialty} onChange={set("specialty")} placeholder="Ex. Comptable, Photographe, Développeuse web" maxLength={80} required {...aria("specialty")} />
        {err("specialty")}
      </div>

      <div>
        <label htmlFor="category" className="field-label">Catégorie</label>
        <select id="category" name="category" className="input" value={v.category} onChange={set("category")} required {...aria("category")}>
          <option value="">Choisir une catégorie</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {err("category")}
      </div>

      <div>
        <label htmlFor="offer" className="field-label">Ce que je propose</label>
        <textarea id="offer" name="offer" className="input min-h-[96px]" value={v.offer} onChange={set("offer")} maxLength={240} rows={3} placeholder="Ex. Tenue de comptabilité mensuelle pour PME et boutiques" required {...aria("offer")} />
        <p className="field-help">{v.offer.length}/240</p>
        {err("offer")}
      </div>

      <div>
        <label htmlFor="seeking" className="field-label">Ce que je recherche <span className="font-normal text-muted">(facultatif)</span></label>
        <textarea id="seeking" name="seeking" className="input min-h-[72px]" value={v.seeking} onChange={set("seeking")} maxLength={160} rows={2} placeholder="Ex. Un stage, des clients, un associé" {...aria("seeking")} />
        <p className="field-help">{v.seeking.length}/160</p>
        {err("seeking")}
      </div>

      <div>
        <label htmlFor="location" className="field-label">Quartier ou commune <span className="font-normal text-muted">(facultatif)</span></label>
        <input id="location" name="location" className="input" value={v.location} onChange={set("location")} placeholder="Ex. Gombe, Limete, Ngaliema" maxLength={80} {...aria("location")} />
        {err("location")}
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="whatsapp" className="field-label">Numéro WhatsApp</label>
          <input id="whatsapp" name="whatsapp" className="input" value={v.whatsapp} onChange={set("whatsapp")} type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex. 0812345678" required {...aria("whatsapp")} />
          <p className="field-help">Ton code sera associé à ce numéro.</p>
          {err("whatsapp")}
        </div>
      )}

      <div>
        <label htmlFor="email" className="field-label">E-mail <span className="font-normal text-muted">(facultatif)</span></label>
        <input id="email" name="email" className="input" value={v.email} onChange={set("email")} type="email" inputMode="email" autoComplete="email" placeholder="nom@exemple.com" {...aria("email")} />
        {err("email")}
      </div>

      <div>
        <label htmlFor="link" className="field-label">LinkedIn ou portfolio <span className="font-normal text-muted">(facultatif)</span></label>
        <input id="link" name="link" className="input" value={v.link} onChange={set("link")} type="url" inputMode="url" placeholder="linkedin.com/in/ton-nom" {...aria("link")} />
        {err("link")}
      </div>

      {mode === "create" && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3.5">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-6 w-6 shrink-0 accent-navy"
              {...aria("consent")}
            />
            <span className="text-[15px] text-ink">
              J&apos;accepte que ma carte soit visible publiquement. Je peux la retirer à tout moment.
            </span>
          </label>
          {err("consent")}
        </div>
      )}

      {serverError && (
        <div role="alert" className="rounded-xl border border-[#E4B4B4] bg-[#FDF2F2] p-3.5 text-[15px] text-[#7F1D1D]">
          {serverError}
        </div>
      )}

      <button type="submit" className="btn-accent w-full text-base" disabled={busy || compressing}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {submitLabel}
      </button>
    </form>
  );
}
