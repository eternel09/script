/** Normalise un numéro en E.164. Par défaut : RDC (+243). Renvoie null si invalide. */
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  let s = input.trim().replace(/[\s.\-()/]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  let digits: string;
  if (s.startsWith("+")) {
    digits = s.slice(1);
  } else if (s.startsWith("243")) {
    digits = s;
  } else if (s.startsWith("0") && s.length === 10) {
    digits = "243" + s.slice(1);
  } else if (s.length === 9) {
    digits = "243" + s;
  } else {
    return null;
  }
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("243") && digits.length !== 12) return null;
  if (digits.length < 8 || digits.length > 15) return null;
  return "+" + digits;
}

/** Affichage lisible : +243 812 345 678 */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+243(\d{3})(\d{3})(\d{3})$/);
  if (m) return `+243 ${m[1]} ${m[2]} ${m[3]}`;
  return e164;
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

const PASTELS = [
  { bg: "#DCE6F2", fg: "#1F3A5F" },
  { bg: "#FBE3CF", fg: "#8A4209" },
  { bg: "#DDEFE3", fg: "#14532D" },
  { bg: "#E9E1F5", fg: "#4B2E83" },
];

export function pastelFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PASTELS[h % PASTELS.length];
}

/** Minuscules, sans accents : pour la recherche et les slugs. */
export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function slugify(s: string): string {
  return normalizeText(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function whatsappContactLink(phone: string, fullName: string): string {
  const text = `Bonjour ${firstName(fullName)}, je vous ai trouvé sur la Vitrine des Talents.`;
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(text)}`;
}

/** Ajoute https:// si l'utilisateur a oublié le schéma. */
export function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
