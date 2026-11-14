import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-5xl font-bold text-navy">404</p>
      <h1 className="mt-3 text-xl font-bold">Cette page n&apos;existe pas ou n&apos;est plus visible.</h1>
      <p className="mt-2 text-ink2">Le profil a peut-être été retiré par son auteur.</p>
      <Link href="/" className="btn-primary mt-6">Retour à la Vitrine</Link>
    </main>
  );
}
