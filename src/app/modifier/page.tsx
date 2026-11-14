import type { Metadata } from "next";
import SimpleHeader from "@/components/SimpleHeader";
import EditFlow from "@/components/EditFlow";
import { contactHref, site } from "@/lib/config";

export const metadata: Metadata = { title: "Modifier ma carte", robots: { index: false } };

export default function ModifierPage() {
  return (
    <>
      <SimpleHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-16">
        <h1 className="text-2xl font-bold">Modifier ou retirer ma carte</h1>
        <p className="mb-5 mt-1 text-ink2">Saisis ton numéro WhatsApp et le code à 6 chiffres reçu à la création.</p>
        <EditFlow contact={site.contact} contactHref={contactHref(site.contact)} />
      </main>
    </>
  );
}
