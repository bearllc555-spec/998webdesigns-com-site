import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy policy | 998 web designs",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="border-b border-rule">
        <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Legal</p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">
            Privacy policy
          </h1>
          <p className="mt-4 text-sm text-slate">Last updated: May 2026</p>

          <div className="prose-cap mt-10 space-y-6 text-base leading-relaxed text-ink-soft">
            <p>
              Bear LLC operates 998 web designs. This policy describes what we collect when you use
              our website or submit a project brief.
            </p>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">What we collect</h2>
              <p className="mt-3">
                When you submit the start-your-site form, we collect the information you provide —
                name, business name, email, phone (optional), and project details. We use this to
                respond to your inquiry, send deposit invoices, and deliver your website.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">How we use it</h2>
              <p className="mt-3">
                We do not sell your data. We use it to operate our business: sales, design delivery,
                hosting, and support. We may use email to send invoices, drafts, and service-related
                messages.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Storage &amp; retention</h2>
              <p className="mt-3">
                Form submissions are stored in our project database. We retain records as long as
                needed to serve clients and meet legal obligations. You may request deletion of your
                data by emailing us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-medium text-ink">Contact</h2>
              <p className="mt-3">
                Privacy requests:{" "}
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
