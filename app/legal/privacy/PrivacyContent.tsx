"use client";

import { useState } from "react";
import Image from "next/image";
import { ContactModal } from "@/components/ContactModal";

export function PrivacyContent() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="font-display text-4xl font-bold text-ink md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate">Last updated: June 2026</p>

        <div className="prose prose-sm mt-12 space-y-8 text-ink">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              1. Introduction
            </h2>
            <p className="text-ink-soft">
              998 web designs (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is operated by Bear LLC. This
              policy explains what we collect when you use 998webdesigns.com, submit our lead or
              contact forms, or pay for a website package.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              2. Information we collect
            </h2>
            <p className="text-ink-soft">
              We collect only what we need to respond, build your site, and process payment.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>
                <strong>Lead form:</strong> Name, business name, email, optional phone, contact
                preference, business and project details, hosting preference, payment option, optional
                start date and notes. We may also record your IP address and submission time for
                abuse prevention.
              </li>
              <li>
                <strong>Contact form:</strong> Name, email, and message when you reach out through
                the contact modal.
              </li>
              <li>
                <strong>Payments:</strong> Stripe handles card payments. We receive confirmation,
                customer email, and transaction metadata from Stripe. We do not store full card
                numbers on our servers.
              </li>
              <li>
                <strong>Site usage:</strong> Standard server and hosting logs (browser type, pages
                requested, approximate timing) from our hosting provider.
              </li>
            </ul>
            <p className="mt-4 text-ink-soft">
              We do not require social network logins and do not pull data from social accounts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              3. How we use information
            </h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>Respond to inquiries and deliver your website project</li>
              <li>Send transactional email (receipts, drafts, project updates)</li>
              <li>Process deposits, balances, and hosting-related billing through Stripe</li>
              <li>Operate, secure, and improve the website</li>
              <li>Comply with law and prevent fraud or abuse</li>
            </ul>
            <p className="mt-4 text-ink-soft">
              We do not sell your personal information. We do not use lead data to build advertising
              profiles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. Where data is stored and who sees it
            </h2>
            <p className="text-ink-soft">
              Lead submissions may be stored in our database (Supabase) and are accessible to our
              team. Email may be sent through our transactional email provider. Payments are
              processed by Stripe under{" "}
              <a
                href="https://stripe.com/privacy"
                className="text-accent underline hover:text-accent-deep"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&rsquo;s privacy policy
              </a>
              . Hosting and file delivery use our cloud hosting vendors. We share data with service
              providers only as needed to run the service, not for their independent marketing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              5. Retention
            </h2>
            <p className="text-ink-soft">
              We keep lead and project records as long as needed to fulfill the engagement, support
              hosting, and meet legal or accounting obligations. You may ask us to delete or
              correct information that is not required to retain by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Security
            </h2>
            <p className="text-ink-soft">
              We use HTTPS, reputable payment and hosting vendors, and access controls on our
              systems. No online service can guarantee perfect security; contact us if you believe
              your data was compromised.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Your choices
            </h2>
            <p className="text-ink-soft">
              You may request access, correction, or deletion of personal data we hold, subject to
              legal and contractual limits (for example, records tied to a completed payment). Email
              us using the contact information below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              8. Changes
            </h2>
            <p className="text-ink-soft">
              We may update this policy. The &ldquo;Last updated&rdquo; date at the top will change
              when we do. Continued use of the site after changes means you accept the revised
              policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              9. Contact
            </h2>
            <p className="text-ink-soft">
              Privacy questions?{" "}
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
