"use client";

import { useState } from "react";
import Image from "next/image";
import { ContactModal } from "@/components/ContactModal";
import { HOSTING_BILLING_START_DAY, HOSTING_MONTHLY_PRICE_MONTH_LABEL, HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";

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
                <strong>Design fee:</strong> $5,998 total, paid on a 50 / 40 / 10 schedule — 50% at
                checkout before your project enters the queue, 40% after design approval or
                development start, and 10% at launch and handover. Channel-specific promo codes
                reduce the design fee only — not hosting or card-processing fees — when entered on
                the lead form at checkout.
              </li>
              <li>
                <strong>Hosting:</strong> You choose 10-year hosting ($2,996 one-time, domain
                registration for .com, .net, or .org included) or month-to-month ({HOSTING_MONTHLY_PRICE_MONTH_LABEL}) on the
                lead form. Your first {HOSTING_TRIAL_DAYS} days of hosting are free after your design payment clears.
                Paid hosting begins on day {HOSTING_BILLING_START_DAY}. Terms for switching between options are stated in
                pricing on the site.
              </li>
              <li>
                <strong>Edits:</strong> Free for the first three months after launch; afterward,
                priced per our published edit policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              3. SMS messaging program
            </h2>
            <p className="text-ink-soft">
              These Terms of Service are published at{" "}
              <a
                href="https://998webdesigns.com/legal/terms"
                className="text-accent underline hover:text-accent-deep"
              >
                998webdesigns.com/legal/terms
              </a>
              . The following SMS terms apply when you opt in to text messages from 998 web designs
              (Bear LLC).
            </p>
            <ul className="mt-4 list-inside list-disc space-y-3 text-ink-soft">
              <li>
                <strong>Program name:</strong> 998 web designs SMS Program
              </li>
              <li>
                <strong>Program description:</strong> Transactional text messages from 998 web
                designs related to your website project — including one-time phone verification on
                our discovery form (/book), optional one-time promotional codes when you separately
                consent during our voice demo, and project or billing texts such as secure checkout
                links or milestone invoices for active clients. We do not send marketing SMS without
                separate, explicit consent.
              </li>
              <li>
                <strong>Message frequency:</strong> Message frequency varies depending on your
                activity. You will typically receive one verification code per discovery session.
                Active clients may receive occasional project-related texts when you or our team
                request SMS delivery (for example a checkout or invoice link).
              </li>
              <li>
                <strong>Message and data rates:</strong> Message and data rates may apply. Check with
                your mobile carrier for details.
              </li>
              <li>
                <strong>Support contact:</strong> For help with our SMS program, email{" "}
                <Image
                  src="/email-address.jpg"
                  alt="email address: hello@998webdesigns.com"
                  width={210}
                  height={44}
                  className="inline-block align-middle"
                />{" "}
                or{" "}
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="text-accent underline transition hover:text-accent-deep"
                >
                  get in touch with us
                </button>
                .
              </li>
              <li>
                <strong>Opt-out instructions:</strong> Reply <strong>STOP</strong> to cancel
                receiving further texts from our number. Reply <strong>HELP</strong> for help. After
                you send STOP, we may send one confirmation text. Message and data rates may apply.
              </li>
              <li>
                <strong>Privacy:</strong> How we collect and use your information — and that we do
                not sell or share it with third parties for marketing — is described in our{" "}
                <a
                  href="https://998webdesigns.com/legal/privacy"
                  className="text-accent underline hover:text-accent-deep"
                >
                  Privacy Policy
                </a>
                .
              </li>
            </ul>
            <p className="mt-4 text-ink-soft">
              <strong>Discovery pipeline (/book):</strong> Our optional discovery flow lets you
              request a call before checkout. By checking the SMS consent box and submitting your
              phone number, you agree to receive a one-time verification text from us (via Twilio) to
              confirm your number. We may email you a secure link to complete your project brief
              and, after a discovery call, a personalized checkout link. Those links are personal —
              do not share them. Clicking your intake email link confirms your email address for that
              session.
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              For carrier and industry guidance on SMS terms of service, see{" "}
              <a
                href="https://help.twilio.com/articles/223134847-Industry-standards-for-US-Short-Code-Terms-of-Service"
                className="text-accent underline hover:text-accent-deep"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twilio&rsquo;s industry standards for US messaging terms
              </a>
              . Public opt-in evidence for campaign review:{" "}
              <a
                href="https://998webdesigns.com/legal/sms-opt-in"
                className="text-accent underline hover:text-accent-deep"
              >
                998webdesigns.com/legal/sms-opt-in
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. Your responsibilities
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
              5. Ownership
            </h2>
            <p className="text-ink-soft">
              You own your site and your domain. We do not claim ownership of your business content.
              If you leave, we provide a clean export. Month-to-month hosting can be canceled
              anytime. 10-year hosting continues for ten years with us; you may migrate files and
              transfer your domain elsewhere, subject to any registrar transfer fees you owe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Payments
            </h2>
            <p className="text-ink-soft">
              Payments are processed by Stripe. Checkout defaults to credit or debit card. You may
              pay by U.S. bank account (ACH) at list price instead. Card payments include a 3%
              processing fee on the design fee only at the initial design Checkout; hosting is not
              charged there. Month-to-month hosting ({HOSTING_MONTHLY_PRICE_MONTH_LABEL}) begins after your {HOSTING_TRIAL_DAYS}-day free
              period via Stripe subscription. 10-year hosting ($2,996) is collected via a separate
              Checkout link we send on day {HOSTING_BILLING_START_DAY}. We do not store full card or
              bank account numbers on our servers.
              We do not collect sales tax at checkout unless we state otherwise in writing for your
              jurisdiction. Bank payments may take several business days to settle; work on your
              design begins when Stripe confirms cleared funds. Refunds are handled case by case.
              Chargebacks without contacting us first may result in suspension of work or hosting.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Acceptable use
            </h2>
            <p className="text-ink-soft">
              You may not use our site or services for unlawful content, spam, malware, or
              infringement of others&rsquo; rights. We may refuse or discontinue service for
              abusive behavior or requests outside our stated scope.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              8. Disclaimers and liability
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
              9. Changes
            </h2>
            <p className="text-ink-soft">
              We may update these terms or on-site pricing copy. Material changes will be posted on
              this page with an updated date. Work already paid for is governed by the terms in
              effect when you paid, unless we agree otherwise in writing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              10. Governing law
            </h2>
            <p className="text-ink-soft">
              These terms are governed by the laws of the State of New Jersey, without regard to
              conflict-of-law rules. Disputes will be brought in courts located in New Jersey,
              unless applicable law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              11. Contact
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
