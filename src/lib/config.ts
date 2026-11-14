import type { Category } from "./types";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "professionnels", label: "Professionnels" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "tech", label: "Tech et numérique" },
  { value: "arts", label: "Arts et savoir-faire" },
  { value: "etudiants", label: "Étudiants" },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];

export function categoryLabel(c: string): string {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

export const site = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  association: process.env.NEXT_PUBLIC_ASSOCIATION_NAME || "Association",
  school: process.env.NEXT_PUBLIC_SCHOOL_NAME || "École",
  contact: process.env.NEXT_PUBLIC_CONTACT || "l'équipe organisatrice",
};

/** Lien vers le contact organisateur : wa.me si numéro, mailto si e-mail. */
export function contactHref(contact: string): string | null {
  if (contact.includes("@")) return `mailto:${contact}`;
  const digits = contact.replace(/\D/g, "");
  if (digits.length >= 8) return `https://wa.me/${digits}`;
  return null;
}
