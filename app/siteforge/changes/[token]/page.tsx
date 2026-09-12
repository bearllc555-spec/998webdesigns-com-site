import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ChangesClient } from "@/components/siteforge/ChangesClient";
import { verifySiteforgeToken } from "@/lib/siteforge-token";
import { siteforgeGetJob } from "@/lib/siteforge-api";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/siteforge/changes", {
  title: "Request mockup changes - 998 web designs",
  robots: { index: false, follow: false },
});

export const dynamic = "force-dynamic";

export default async function SiteforgeChangesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw || "");
  const payload = verifySiteforgeToken(token, "changes");

  let body: React.ReactNode;

  if (!payload) {
    body = (
      <p className="text-ink/80">
        This link is invalid or expired. Reply to your mockup email and we&apos;ll send a
        fresh link.
      </p>
    );
  } else {
    try {
      const bundle = await siteforgeGetJob(payload.jobId);
      body = (
        <ChangesClient
          token={token}
          businessName={bundle.lead.business_name || bundle.lead.full_name || "your business"}
          conceptImageUrl={bundle.job.concept_image_url || null}
          previewUrl={bundle.job.preview_url}
          status={bundle.job.status}
        />
      );
    } catch {
      body = (
        <p className="text-ink/80">
          We couldn&apos;t load this mockup. Reply to your email and we&apos;ll help.
        </p>
      );
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main" className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-display text-3xl text-ink mb-6">Request changes</h1>
        {body}
      </main>
      <Footer />
    </div>
  );
}
