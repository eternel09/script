import Link from "next/link";
import { ClipboardList, KeyRound, Plus, QrCode } from "lucide-react";
import Header, { inscriptionHref } from "@/components/Header";
import Footer from "@/components/Footer";
import Catalogue from "@/components/Catalogue";
import { listPublished } from "@/lib/talents";
import { isConfigured } from "@/lib/supabase";
import { qrSvg } from "@/lib/qr";
import { site } from "@/lib/config";
import type { PublicTalent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let talents: PublicTalent[] = [];
  let loadError = false;
  if (isConfigured()) {
    try {
      talents = await listPublished();
    } catch (e) {
      console.error(e);
      loadError = true;
    }
  } else {
    loadError = true;
  }

  const href = inscriptionHref();
  const qr = await qrSvg(site.url + href);

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-navy text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-16 pt-10 md:grid-cols-[1fr_auto] md:pb-20 md:pt-14">
            <div>
              <h1 className="text-[30px] font-bold leading-tight sm:text-4xl md:text-5xl">
                Les talents de notre communauté, <span className="text-accent-light">à un message près.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-[#DCE6F2] sm:text-lg">
                Trouvez un prestataire, un stagiaire ou un associé parmi nos membres, et contactez-le directement. Sans
                compte, sans intermédiaire.
              </p>
              <Link href={href} className="btn-accent mt-6 sm:hidden">
                <Plus className="h-5 w-5" aria-hidden /> Ajouter mon talent
              </Link>
            </div>
            <div className="hidden w-[220px] rounded-card bg-white p-4 text-center text-ink md:block">
              <div className="qr-box" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR code d'inscription" />
              <p className="mt-2 font-display text-[15px] font-bold leading-snug">Scanne et crée ta carte</p>
              <p className="text-sm text-muted">2 minutes, sans compte</p>
            </div>
          </div>
        </section>

        {loadError ? (
          <div className="mx-auto max-w-6xl px-4">
            <div className="card -mt-7 p-6 text-ink2">
              Le catalogue est momentanément indisponible. Réessayez dans un instant.
            </div>
          </div>
        ) : (
          <Catalogue talents={talents} />
        )}

        {/* Comment ça marche */}
        <section id="comment" aria-labelledby="comment-titre" className="mx-auto mt-14 max-w-6xl scroll-mt-4 px-4">
          <h2 id="comment-titre" className="text-2xl font-bold">
            Comment ça marche
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { icon: QrCode, title: "Scanne le QR code", text: "Sur l'affiche de l'événement ou sur cette page." },
              { icon: ClipboardList, title: "Remplis ta carte", text: "Photo, spécialité, contacts : 2 minutes, sans compte." },
              { icon: KeyRound, title: "Garde ton code", text: "Ton code à 6 chiffres te permet de modifier ou retirer ta carte." },
            ].map((s, i) => (
              <li key={s.title} className="card flex gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBE3CF] text-accent-dark">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-display font-bold">
                    {i + 1}. {s.title}
                  </span>
                  <span className="mt-1 block text-[15px] text-ink2">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />

      {/* Bouton flottant mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link href={href} className="btn-accent w-full">
          <Plus className="h-5 w-5" aria-hidden /> Ajouter mon talent
        </Link>
      </div>
    </>
  );
}
