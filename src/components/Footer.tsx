import Link from "next/link";
import { site, contactHref } from "@/lib/config";

export default function Footer() {
  const href = contactHref(site.contact);
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 text-sm text-ink2 sm:pb-8">
        <p>
          Chaque membre publie et retire sa carte lui-même. Signaler un profil :{" "}
          {href ? (
            <a href={href} className="font-semibold text-navy underline underline-offset-2">
              {site.contact}
            </a>
          ) : (
            <span className="font-semibold">{site.contact}</span>
          )}
        </p>
        <p className="mt-2 text-muted">
          Vitrine des Talents · {site.association} · {site.school} ·{" "}
          <Link href="/modifier" className="underline underline-offset-2">
            Modifier ma carte
          </Link>
        </p>
      </div>
    </footer>
  );
}
