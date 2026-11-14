import type { Metadata } from "next";
import SimpleHeader from "@/components/SimpleHeader";
import { AdminLogin, AdminPanel } from "@/components/Admin";
import { isAdmin } from "@/lib/admin";
import { listAll, moderationOn } from "@/lib/talents";
import { seedDemoEnabled } from "@/lib/demo";
import { isConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function AdminPage() {
  if (!isAdmin()) {
    return (
      <>
        <SimpleHeader />
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-bold">Espace organisateur</h1>
          <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />
        </main>
      </>
    );
  }

  let error: string | null = null;
  let talents: Awaited<ReturnType<typeof listAll>> = [];
  if (!isConfigured()) error = "Supabase n'est pas configuré (variables d'environnement manquantes).";
  else {
    try {
      talents = await listAll();
    } catch (e) {
      console.error(e);
      error = "Lecture de la base impossible. As-tu exécuté supabase/schema.sql ?";
    }
  }

  return (
    <>
      <SimpleHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <AdminPanel
          talents={talents}
          error={error}
          moderation={moderationOn()}
          seedDemo={seedDemoEnabled()}
        />
      </main>
    </>
  );
}
