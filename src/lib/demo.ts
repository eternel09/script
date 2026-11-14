import type { Category } from "./types";

/** Profils fictifs (SEED_DEMO=true). Numéros factices +24399000000x. */
export const DEMO_TALENTS: {
  full_name: string;
  specialty: string;
  category: Category;
  offer: string;
  seeking?: string;
  location?: string;
}[] = [
  { full_name: "Grace Mbuyi", specialty: "Comptabilité et dossiers de crédit", category: "professionnels", offer: "Tenue de comptabilité mensuelle pour PME et boutiques", seeking: "Nouveaux clients PME", location: "Gombe" },
  { full_name: "Patrick Ilunga", specialty: "Développeur web et mobile", category: "tech", offer: "Sites vitrines, boutiques en ligne et applications", seeking: "Projets freelance", location: "Lingwala" },
  { full_name: "Sarah Kabeya", specialty: "Juriste d'affaires", category: "professionnels", offer: "Statuts de société, contrats commerciaux, conformité", location: "Gombe" },
  { full_name: "Junior Lukusa", specialty: "Photographe et vidéaste", category: "arts", offer: "Portraits professionnels, événements, vidéos courtes", seeking: "Partenariats avec des agences", location: "Bandalungwa" },
  { full_name: "Divine Ngalula", specialty: "Couture sur mesure", category: "arts", offer: "Tenues en pagne, uniformes, retouches", location: "Kintambo" },
  { full_name: "Christian Mwamba", specialty: "Community manager", category: "tech", offer: "Gestion de pages, contenus et campagnes", location: "Limete" },
  { full_name: "Ruth Kalombo", specialty: "Traiteur événementiel", category: "entrepreneurs", offer: "Buffets et cocktails pour mariages et entreprises", seeking: "Un associé pour la logistique", location: "Ngaliema" },
  { full_name: "Daniel Tshibanda", specialty: "Étudiant en génie électrique", category: "etudiants", offer: "Installations solaires, recherche un stage", seeking: "Un stage en énergie solaire", location: "Lemba" },
];

export function seedDemoEnabled(): boolean {
  return (process.env.SEED_DEMO || "false").toLowerCase() === "true";
}
