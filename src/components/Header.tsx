import Link from "next/link";
import { Plus } from "lucide-react";
import { site } from "@/lib/config";
import { inscriptionToken } from "@/lib/security";

export function Logo() {
  return (
    <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-base font-bold text-accent-light"
        aria-hidden
      >
        VT
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-bold text-ink">Vitrine des Talents</span>
        <span className="block text-xs text-muted">
          {site.association} · {site.school}
        </span>
      </span>
    </Link>
  );
}

export function inscriptionHref(): string {
  return `/inscription?e=${encodeURIComponent(inscriptionToken())}`;
}

export default function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Logo />
        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          <Link href="/#comment" className="btn-ghost hidden md:inline-flex">
            Comment ça marche
          </Link>
          <Link href="/modifier" className="btn-ghost hidden sm:inline-flex">
            Modifier ma carte
          </Link>
          <Link href={inscriptionHref()} className="btn-accent hidden sm:inline-flex">
            <Plus className="h-5 w-5" aria-hidden /> Ajouter mon talent
          </Link>
          <Link href="/modifier" className="btn-ghost px-3 text-sm sm:hidden">
            Modifier
          </Link>
        </nav>
      </div>
    </header>
  );
}
