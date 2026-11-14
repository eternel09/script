import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "optional" });
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-grotesk",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Vitrine des Talents", template: "%s · Vitrine des Talents" },
  description: `Les talents de ${site.association} · ${site.school}. Trouvez un prestataire, un stagiaire ou un associé et contactez-le directement.`,
  openGraph: {
    title: "Vitrine des Talents",
    description: "Les talents de notre communauté, à un message près.",
    type: "website",
    locale: "fr_FR",
    siteName: "Vitrine des Talents",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1F3A5F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
