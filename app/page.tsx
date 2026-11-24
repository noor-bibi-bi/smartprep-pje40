export const dynamic = "force-dynamic";

import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SpecTable } from "@/components/landing/spec-table";
import { CtaBand } from "@/components/landing/cta-band";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <>
      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <HowItWorks />
        <SpecTable />
        <CtaBand isAuthenticated={isAuthenticated} />
      </main>
      <SiteFooter isAuthenticated={isAuthenticated} />
    </>
  );
}
