"use client";

import { useState } from "react";
import Image from "next/image";
import { ContactModal } from "@/components/ContactModal";

export function TermsContent() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="font-display text-4xl font-bold text-ink md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-slate">Last updated: June 2026</p>

        <div className="prose prose-sm mt-12 space-y-8 text-ink">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              1. Who we are
            </h2>
            <p className="text-ink-soft">
              998 web designs (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is a website design and hosting
              service operated by Bear LLC. Our site is 998webdesigns.com. These terms apply when
              you browse the site, submit our lead form, or purchase a website package.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              2. What you are buying
            </h2>
            <p className="text-ink-soft">
              The core offer is a handcrafted custom website for a flat $5,998 design fee, delivered
              in 7 business days after your payment clears. Add-on timelines begin when all
              required client materials are received. Add-ons are typically delivered within 1–3
              business days of site delivery. Full-stack builds (three or more add-ons) are delivered
              within 14 business days. Scope, pricing, hosting options, and edit policy are described
              on our home page and in the FAQ. That on-page copy is part of what you agree to when
              you submit the lead form and pay.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>
                <strong>Design fee:</strong> $5,998 paid in full at checkout before your project
                enters the queue. Channel-specific promo codes reduce the design fee only — not
                hosting or card-processing fees — when entered on the lead form at checkout.
              </li>
              <li>
                <strong>Hosting:</strong> You choose lifetime hosting ($2,996 one-time) or
                month-to-month ($198/month) on the lead form. Your first 30 days of hosting are
                free after your design payment clears. Paid hosting begins on day 31. Terms for
                switching between options are stated in pricing on the site.
              </li>
              <li>
                <strong>Edits:</strong> Free for the first three months after launch; afterward,
                priced per our published edit policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              3. Your responsibilities
            </h2>
            <p className="text-ink-soft">
              You agree to provide accurate information in the lead form, respond within the
              approval window we describe (14 days from draft delivery unless we agree otherwise in
              writing), and supply brand assets or feedback we need to complete the site. Delays on
              your side may push delivery dates. If we send a draft and do not hear back within 14
              days, the project may be treated as complete as described in the Project Completion
              section below and on our thank-you page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Project Completion &amp; Inactivity Policy
            </h2>
            <p className="text-ink-soft">
              Your project is considered complete if we do not receive feedback or revision requests
              within 14 days of delivering a draft. Completed designs are held on file for 90 days
              — if you return within that window, we&apos;ll pick up where we left off under the
              standard edit terms. After 90 days, a re-engagement fee of $349 applies to reopen the
              project.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. Ownership
            </h2>
            <p className="text-ink-soft">
              You own your site and your domain. We do not claim ownership of your business content.
              If you leave, we provide a clean export. Month-to-month hosting can be canceled
              anytime. Lifetime hosting continues for the life of your site with us; you may migrate files and
              transfer your domain elsewhere, subject to any registrar transfer fees you owe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              5. Payments
            </h2>
            <p className="text-ink-soft">
              Payments are processed by Stripe. Checkout defaults to credit or debit card. You may
              pay by U.S. bank account (ACH) at list price instead. Card payments include a 3%
              processing fee on the design fee only at the initial design Checkout; hosting is not
              charged there. Month-to-month hosting ($198/month) begins after your 30-day free
              period via Stripe subscription. Lifetime hosting ($2,996) is collected via a separate
              Checkout link we send on day 31. We do not store full card or
              bank account numbers on our servers.
              We do not collect sales tax at checkout unless we state otherwise in writing for your
              jurisdiction. Bank payments may take several business days to settle; work on your
              design begins when Stripe confirms cleared funds. Refunds are handled case by case.
              Chargebacks without contacting us first may result in suspension of work or hosting.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Acceptable use
            </h2>
            <p className="text-ink-soft">
              You may not use our site or services for unlawful content, spam, malware, or
              infringement of others&rsquo; rights. We may refuse or discontinue service for
              abusive behavior or requests outside our stated scope.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Disclaimers and liability
            </h2>
            <p className="text-ink-soft">
              Websites and hosting are provided on an &ldquo;as is&rdquo; basis. We do not guarantee
              specific revenue, rankings, or traffic. To the fullest extent permitted by law, our
              liability for any claim arising from these terms or your project is limited to the
              amounts you paid us for that project in the twelve months before the claim. We are not
              liable for indirect or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              8. Changes
            </h2>
            <p className="text-ink-soft">
              We may update these terms or on-site pricing copy. Material changes will be posted on
              this page with an updated date. Work already paid for is governed by the terms in
              effect when you paid, unless we agree otherwise in writing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              9. Governing law
            </h2>
            <p className="text-ink-soft">
              These terms are governed by the laws of the State of New Jersey, without regard to
              conflict-of-law rules. Disputes will be brought in courts located in New Jersey,
              unless applicable law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              10. Contact
            </h2>
            <p className="text-ink-soft">
              Questions about these terms?{" "}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="text-accent underline transition hover:text-accent-deep"
              >
                get in touch with us
              </button>
              {" "}or email{" "}
              <Image
                src="/email-address.jpg"
                alt="email address: hello@998webdesigns.com"
                width={210}
                height={44}
                className="inline-block align-middle"
              />
            </p>
          </section>
        </div>
      </main>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
