import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, ArrowRight } from "lucide-react";
import type { PublicTalent } from "@/lib/types";
import { categoryLabel } from "@/lib/config";
import { initials, pastelFor, whatsappContactLink } from "@/lib/utils";

type CardData = Pick<
  PublicTalent,
  "slug" | "full_name" | "specialty" | "category" | "offer" | "location" | "whatsapp" | "email" | "photo_url"
>;

export function Avatar({
  name,
  src,
  className = "",
  sizes,
  priority,
  unoptimized,
  textClass = "text-4xl",
}: {
  name: string;
  src: string | null;
  className?: string;
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
  textClass?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-[#E3E8EF] ${className}`}>
        <Image
          src={src}
          alt={`Photo de ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className="object-cover"
        />
      </div>
    );
  }
  const p = pastelFor(name);
  return (
    <div
      className={`flex items-center justify-center font-display font-bold ${textClass} ${className}`}
      style={{ background: p.bg, color: p.fg }}
      role="img"
      aria-label={`Initiales de ${name}`}
    >
      {initials(name)}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className="pill bg-[#E8EEF6] text-navy">{categoryLabel(category)}</span>;
}

/** Carte du catalogue. `preview` désactive les liens (étape d'aperçu). */
export default function TalentCard({
  t,
  priority,
  preview,
  unoptimized,
}: {
  t: CardData;
  priority?: boolean;
  preview?: boolean;
  unoptimized?: boolean;
}) {
  const wa = whatsappContactLink(t.whatsapp, t.full_name);
  const linkProps = preview ? { tabIndex: -1, "aria-disabled": true, onClick: undefined } : {};
  return (
    <article className="card relative flex h-full flex-col overflow-hidden">
      <Avatar
        name={t.full_name}
        src={t.photo_url}
        className="aspect-[4/3] w-full"
        sizes="(max-width: 640px) 100vw, 320px"
        priority={priority}
        unoptimized={unoptimized}
        textClass="text-5xl"
      />
      <div className="flex flex-1 flex-col p-4">
        <div>
          <CategoryBadge category={t.category} />
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug text-ink">{t.full_name}</h3>
        <p className="text-[15px] font-semibold text-navy">{t.specialty}</p>
        <p className="mt-2 line-clamp-2 text-[15px] text-ink2">{t.offer}</p>
        {t.location && (
          <p className="mt-2 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-4 w-4" aria-hidden /> {t.location}
          </p>
        )}
        <div className="mt-auto pt-4">
          <div className="flex gap-2">
            <a
              href={preview ? undefined : wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa flex-1"
              {...linkProps}
            >
              <MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp
            </a>
            <a
              href={preview ? undefined : `tel:${t.whatsapp}`}
              className="btn-outline px-3"
              aria-label={`Appeler ${t.full_name}`}
              {...linkProps}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
            {t.email && (
              <a
                href={preview ? undefined : `mailto:${t.email}`}
                className="btn-outline px-3"
                aria-label={`Écrire un e-mail à ${t.full_name}`}
                {...linkProps}
              >
                <Mail className="h-5 w-5" aria-hidden />
              </a>
            )}
          </div>
          {preview ? (
            <span className="btn-ghost mt-2 w-full">
              Voir le profil <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          ) : (
            <Link href={`/t/${t.slug}`} className="btn-ghost mt-2 w-full">
              Voir le profil <ArrowRight className="h-4 w-4" aria-hidden />
              <span className="sr-only"> de {t.full_name}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
