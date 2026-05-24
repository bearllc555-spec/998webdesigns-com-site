import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms of service | 998 web designs",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="border-b border-rule">
        <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Legal</p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">
            Terms of service
          </h1>
          <p className="mt-4 text-sm text-slate">Last updated: May 2026</p>

          <div className="prose-cap mt-10 space-y-6 text-base leading-relaxed text-ink-soft">
            <p>
              998 web designs is a digital property of Bear LLC (&ldquo;we,&rdquo; &ldquo;us&rdquo;).
              By submitting a project brief or paying an invoice, you agree to these terms.
            </p>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">The service</h2>
              <p className="mt-3">
                We design and host custom small-business websites for a flat design fee ($998 total,
                typically invoiced as $499 deposit + $499 balance at approval). Scope, hosting
                options, and edit pricing are described on our pricing page at the time you engage
                us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Ownership</h2>
              <p className="mt-3">
                You own your content and the custom design we create for you. We retain rights to
                our tools, templates, and process. If you leave, we provide a reasonable export of
                your site files.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Approval window</h2>
              <p className="mt-3">
                When we deliver a design draft, you have 7 business days to respond with approval
                or revision requests. If we do not hear back within that window, the project may be
                marked final and the balance invoice issued, as stated on our website and thank-you
                page.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Hosting &amp; cancellation</h2>
              <p className="mt-3">
                Month-to-month hosting may be cancelled anytime. Lifetime hosting is a one-time fee
                for ongoing hosting. Past monthly payments do not apply toward lifetime hosting
                conversion.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Contact</h2>
              <p className="mt-3">
                Questions:{" "}
                <a href="mailto:hello@998webdesigns.com" className="text-accent hover:underline">
                  hello@998webdesigns.com
                </a>
              </p>
            </section>
          </div>

          <Link
            href="/"
            className="mt-12 inline-flex rounded-full border border-rule px-5 py-3 text-sm font-medium text-ink transition hover:border-ink-soft"
          >
            &larr; Back to home
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
