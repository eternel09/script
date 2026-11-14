export type Category = "professionnels" | "entrepreneurs" | "tech" | "arts" | "etudiants";
export type Status = "published" | "pending" | "hidden";

/** Carte telle qu'affichée publiquement (jamais de hash). */
export type PublicTalent = {
  id: string;
  slug: string;
  full_name: string;
  specialty: string;
  category: Category;
  offer: string;
  seeking: string | null;
  location: string | null;
  whatsapp: string;
  email: string | null;
  link: string | null;
  photo_url: string | null;
  created_at: string;
};

export type AdminTalent = PublicTalent & {
  status: Status;
  consent: boolean;
  is_demo: boolean;
  updated_at: string;
};

export const PUBLIC_COLUMNS =
  "id, slug, full_name, specialty, category, offer, seeking, location, whatsapp, email, link, photo_url, created_at";

export const ADMIN_COLUMNS = `${PUBLIC_COLUMNS}, status, consent, is_demo, updated_at`;
