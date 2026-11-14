import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Link2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Footer from "@/components/Footer";
import { Logo } from "@/components/Header";
import ShareButton from "@/components/ShareButton";
import { Avatar, CategoryBadge } from "@/components/TalentCard";
import { getPublishedBySlug } from "@/lib/talents";
import { qrSvg } from "@/lib/qr";
import { site } from "@/lib/config";
import { formatPhone, whatsappContactLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

async function load(slug: string) {
  try {
    return await getPublishedBySlug(slug);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await load(params.slug);
  if (!t) return { title: "Profil introuvable" };
  const description = `${t.specialty} · ${t.offer}`;
  return {
    title: `${t.full_name} · ${t.specialty}`,
    description,
    openGraph: {
      title: `${t.full_name} · ${t.specialty}`,
      description,
      url: `${site.url}/t/${t.slug}`,
      type: "profile",
      images: t.photo_url ? [{ url: t.photo_url, width: 800, height: 600, alt: t.full_name }] : undefined,
    },
    twitter: { card: t.photo_url ? "summary_large_image" : "summary" },
  };
}

export default async function TalentPage({ params }: Props) {
  const t = await load(params.slug);
  if (!t) notFound();

  const url = `${site.url}/t/${t.slug}`;
  const qr = await qrSvg(url);

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="btn-ghost -ml-2 px-2">
            <ArrowLeft className="h-5 w-5" aria-hidden /> Retour
          </Link>
          <ShareButton url={url} title={`${t.full_name} · Vitrine des Talents`} />
        </div>

        <article className="card mt-3 overflow-hidden">
          <Avatar
            name={t.full_name}
            src={t.photo_url}
            className="aspect-[4/3] w-full sm:aspect-[16/9]"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            textClass="text-7xl"
          />
          <div className="p-5 sm:p-7">
            <h1 className="text-2xl font-bold sm:text-3xl">{t.full_name}</h1>
            <p className="mt-1 text-lg font-semibold text-navy">{t.specialty}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CategoryBadge category={t.category} />
              {t.location && (
                <span className="pill gap-1 bg-bg text-ink2">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {t.location}
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a href={whatsappContactLink(t.whatsapp, t.full_name)} target="_blank" rel="noopener noreferrer" className="btn-wa">
                <MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp
              </a>
              <a href={`tel:${t.whatsapp}`} className="btn-outline">
                <Phone className="h-5 w-5" aria-hidden /> Appeler
              </a>
            </div>

            <section className="mt-7">
              <h2 className="text-lg font-bold">Ce que je propose</h2>
              <p className="mt-1.5 whitespace-pre-line text-ink2">{t.offer}</p>
            </section>
            {t.seeking && (
              <section className="mt-6">
                <h2 className="text-lg font-bold">Ce que je recherche</h2>
                <p className="mt-1.5 whitespace-pre-line text-ink2">{t.seeking}</p>
              </section>
            )}

            <section className="mt-6">
              <h2 className="text-lg font-bold">Contacts</h2>
              <ul className="mt-2 divide-y divide-line">
                <li>
                  <a href={whatsappContactLink(t.whatsapp, t.full_name)} target="_blank" rel="noopener noreferrer" className="flex min-h-[48px] items-center gap-3 text-ink hover:text-navy">
                    <MessageCircle className="h-5 w-5 text-wa" aria-hidden /> WhatsApp · {formatPhone(t.whatsapp)}
                  </a>
                </li>
                <li>
                  <a href={`tel:${t.whatsapp}`} className="flex min-h-[48px] items-center gap-3 text-ink hover:text-navy">
                    <Phone className="h-5 w-5 text-navy" aria-hidden /> {formatPhone(t.whatsapp)}
                  </a>
                </li>
                {t.email && (
                  <li>
                    <a href={`mailto:${t.email}`} className="flex min-h-[48px] items-center gap-3 break-all text-ink hover:text-navy">
                      <Mail className="h-5 w-5 shrink-0 text-navy" aria-hidden /> {t.email}
                    </a>
                  </li>
                )}
                {t.link && (
                  <li>
                    <a href={t.link} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-[48px] items-center gap-3 break-all text-ink hover:text-navy">
                      <Link2 className="h-5 w-5 shrink-0 text-navy" aria-hidden /> {t.link.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                )}
              </ul>
            </section>

            <section className="mt-7 flex flex-col items-center gap-3 rounded-card bg-bg p-5 sm:flex-row sm:items-center">
              <div className="qr-box w-36 shrink-0 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label={`QR code du profil de ${t.full_name}`} />
              <div className="text-center sm:text-left">
                <h2 className="font-bold">QR de ce profil</h2>
                <p className="text-sm text-ink2">Scannez-le pour retrouver ce profil sur votre téléphone.</p>
                <a href={`/api/qr/${t.slug}?download`} className="btn-outline mt-2" download>
                  <Download className="h-5 w-5" aria-hidden /> Télécharger le QR
                </a>
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
