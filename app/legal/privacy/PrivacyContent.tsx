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
            <p className="mt-4 text-ink-soft">
              This document details what personal information we collect, how we use it, and confirms
              that we do not sell your information or share it with third parties for their marketing
              or promotional purposes. We use your data only to operate our services, deliver your
              project, and communicate with you about your request.
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
                <strong>Mobile phone numbers:</strong> Optional phone on the lead form; phone
                number and SMS consent on the discovery form (/book); phone collected during our
                voice demo when you agree to save your number; inbound texts you send to our business
                number; and phone on file for clients who receive transactional project or billing
                texts from our team.
              </li>
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
                <strong>Payments:</strong> Stripe handles card and bank (ACH) payments. We receive
                confirmation, customer email, and transaction metadata from Stripe. We do not store
                full card or bank account numbers on our servers.
              </li>
              <li>
                <strong>Discovery pipeline (/book):</strong> Name, email, phone, project goal, and
                SMS consent when you start a discovery call. We send a one-time verification code by
                text and may send transactional email with your intake link and payment link after a
                call.
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
              <li>Send transactional SMS you opted into (verification codes, checkout links, project updates)</li>
              <li>Process payments and hosting-related billing through Stripe</li>
              <li>Operate, secure, and improve the website</li>
              <li>Comply with law and prevent fraud or abuse</li>
            </ul>
            <p className="mt-4 text-ink-soft">
              We do not sell your personal information. We do not use lead or contact data to build
              advertising profiles. We do not share, sell, rent, or lease your personal
              information — including your mobile phone number — to third parties for their marketing,
              promotional, or lead-generation purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. SMS and phone communications
            </h2>
            <p className="text-ink-soft">
              If you opt in on our discovery form (/book), we may send you a one-time SMS
              verification code through Twilio to confirm your phone number. With separate consent
              during our voice demo, we may send a one-time promotional code by text. For active
              clients, we may send transactional texts such as checkout links or milestone invoices
              when you or our team request email and/or SMS delivery. Message frequency varies by
              your activity — typically one verification code per session, plus occasional
              project-related messages tied to your request. Message and data rates may apply.
            </p>
            <p className="mt-4 text-ink-soft">
              Reply STOP to opt out of further texts from our number; reply HELP for help. We do not
              send marketing SMS without separate, explicit consent. Your mobile number is used only
              for verification, scheduling follow-up, and project or billing communications related
              to your request — not sold, rented, or shared with third parties for their marketing.
            </p>
            <p className="mt-4 text-ink-soft">
              Our SMS program privacy terms are described on this page at{" "}
              <a
                href="https://998webdesigns.com/legal/privacy"
                className="text-accent underline hover:text-accent-deep"
              >
                998webdesigns.com/legal/privacy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              5. Where data is stored and who sees it
            </h2>
            <p className="text-ink-soft">
              Lead submissions may be stored in our database (Supabase) and are accessible to our
              team. Contact form and lead confirmation emails are sent through Resend. SMS is
              delivered through Twilio under{" "}
              <a
                href="https://www.twilio.com/legal/privacy"
                className="text-accent underline hover:text-accent-deep"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twilio&rsquo;s privacy policy
              </a>
              . Payments are processed by Stripe under{" "}
              <a
                href="https://stripe.com/privacy"
                className="text-accent underline hover:text-accent-deep"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&rsquo;s privacy policy
              </a>
              . Site analytics may be collected by Vercel Analytics. Hosting and file delivery use
              our cloud hosting vendors.
            </p>
            <p className="mt-4 text-ink-soft">
              We share data with service providers (for example Twilio, Stripe, Resend, Supabase,
              and Vercel) only as needed to run the service — such as sending a text you requested,
              processing a payment, or hosting the site. Those providers process data on our behalf;
              we do not authorize them to use your information for their own marketing. We do not
              disclose your personal information to unrelated third parties for their marketing
              purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Retention
            </h2>
            <p className="text-ink-soft">
              We keep lead and project records as long as needed to fulfill the engagement, support
              hosting, and meet legal or accounting obligations. You may ask us to delete or
              correct information that is not required to retain by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Security
            </h2>
            <p className="text-ink-soft">
              We use HTTPS, reputable payment and hosting vendors, and access controls on our
              systems. No online service can guarantee perfect security; contact us if you believe
              your data was compromised.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              8. Your choices
            </h2>
            <p className="text-ink-soft">
              You may request access, correction, or deletion of personal data we hold, subject to
              legal and contractual limits (for example, records tied to a completed payment). Email
              us using the contact information below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              9. Changes
            </h2>
            <p className="text-ink-soft">
              We may update this policy. The &ldquo;Last updated&rdquo; date at the top will change
              when we do. Continued use of the site after changes means you accept the revised
              policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              10. Contact
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
