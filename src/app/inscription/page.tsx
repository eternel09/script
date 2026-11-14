import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import InscriptionFlow from "@/components/InscriptionFlow";
import { isValidInscriptionToken } from "@/lib/security";
import { site } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ajouter mon talent", robots: { index: false } };

export default function InscriptionPage({ searchParams }: { searchParams: { e?: string } }) {
  const token = typeof searchParams.e === "string" ? searchParams.e : "";
  const valid = isValidInscriptionToken(token);

  return (
    <>
      <SimpleHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-16">
        {valid ? (
          <>
            <h1 className="text-2xl font-bold">Crée ta carte</h1>
            <p className="mb-5 mt-1 text-ink2">2 minutes, sans compte.</p>
            <InscriptionFlow token={token} siteUrl={site.url} />
          </>
        ) : (
          <div className="card mt-6 p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBE3CF] text-accent-dark">
              <QrCode className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold">Scanne le QR code officiel de l&apos;événement</h1>
            <p className="mt-2 text-ink2">Ce lien d&apos;inscription n&apos;est pas valide.</p>
            <Link href="/" className="btn-primary mt-5">Voir la Vitrine</Link>
          </div>
        )}
      </main>
    </>
  );
}
