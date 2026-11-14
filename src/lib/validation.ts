import { z } from "zod";
import { CATEGORY_VALUES } from "./config";
import { normalizePhone, normalizeUrl } from "./utils";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

/** Champs communs à la création et à la modification d'une carte. */
export const talentFields = z.object({
  full_name: z.string().trim().min(2, "Nom trop court.").max(80, "80 caractères maximum."),
  specialty: z.string().trim().min(2, "Spécialité trop courte.").max(80, "80 caractères maximum."),
  category: z.enum(CATEGORY_VALUES, { errorMap: () => ({ message: "Choisis une catégorie." }) }),
  offer: z.string().trim().min(2, "Décris ce que tu proposes.").max(240, "240 caractères maximum."),
  seeking: optionalText(160),
  location: optionalText(80),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "E-mail invalide."),
  link: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? normalizeUrl(v) : null))
    .refine((v) => v === null || z.string().url().safeParse(v).success, "Lien invalide."),
});

export const whatsappField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro WhatsApp invalide (ex. 0812345678)." });
      return z.NEVER;
    }
    return n;
  });

export const createSchema = talentFields.extend({
  whatsapp: whatsappField,
  consent: z.literal("true", { errorMap: () => ({ message: "Ton accord est nécessaire pour publier ta carte." }) }),
});

export const editLoginSchema = z.object({
  whatsapp: whatsappField,
  code: z.string().trim().regex(/^\d{6}$/, "Le code contient 6 chiffres."),
});

/** Lit un FormData en objet de chaînes (hors fichiers). */
export function formToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string") o[k] = v;
  });
  return o;
}

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Données invalides.";
}
