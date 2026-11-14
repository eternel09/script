import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { qrSvg } from "@/lib/qr";
import { site } from "@/lib/config";
import { inscriptionToken } from "@/lib/security";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Affiche d'inscription", robots: { index: false } };

export default async function QrPage() {
  const token = inscriptionToken();
  const url = `${site.url}/inscription?e=${encodeURIComponent(token)}`;
  const qr = await qrSvg(url, { margin: 2 });

  return (
    <main className="min-h-screen bg-bg print:bg-white">
      <div className="no-print mx-auto flex max-w-[210mm] items-center justify-between gap-2 px-4 py-4">
        <Link href="/admin" className="btn-ghost px-2">
          <ArrowLeft className="h-5 w-5" aria-hidden /> Admin
        </Link>
        <PrintButton>
          <Printer className="h-5 w-5" aria-hidden /> Imprimer l&apos;affiche
        </PrintButton>
      </div>
      {!token && (
        <p className="no-print mx-auto max-w-[210mm] px-4 pb-4 font-semibold text-[#9B1C1C]">
          Attention : INSCRIPTION_TOKEN n&apos;est pas configuré. Ce QR ne fonctionnera pas.
        </p>
      )}

      <section className="mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col items-center justify-between bg-white px-[8%] py-[7%] text-center shadow-sm print:aspect-auto print:h-[270mm] print:max-w-none print:shadow-none">
        <div className="flex flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy font-display text-2xl font-bold text-accent-light print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
            VT
          </span>
          <p className="mt-3 font-display text-xl font-bold text-navy">Vitrine des Talents</p>
          <p className="text-base text-muted">{site.association} · {site.school}</p>
        </div>

        <h1 className="font-display text-[clamp(40px,9vw,76px)] font-bold leading-none text-ink">Inscris-toi ici</h1>

        <div className="qr-box w-[70%] max-w-[120mm]" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR code d'inscription" />

        <ol className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-display text-[clamp(18px,3.4vw,28px)] font-bold text-ink">
          <li><span className="text-accent">1.</span> Scanne</li>
          <li><span className="text-accent">2.</span> Remplis (2 min)</li>
          <li><span className="text-accent">3.</span> Garde ton code</li>
        </ol>

        <p className="break-all font-mono text-[clamp(11px,1.8vw,15px)] text-ink2">{url}</p>
      </section>
    </main>
  );
}
