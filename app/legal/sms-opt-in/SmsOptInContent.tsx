import Link from "next/link";

const BOOK_CONSENT_COPY =
  "I agree to receive SMS messages from 998 web designs, including a one-time verification code and occasional transactional messages related to my website project. Message frequency varies. Message and data rates may apply. Reply STOP to opt out. Reply HELP for help.";

export function SmsOptInContent() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <h1 className="font-display text-4xl font-bold text-ink md:text-5xl">
        SMS opt-in documentation
      </h1>
      <p className="mt-4 text-sm text-slate">Last updated: June 2026</p>
      <p className="mt-6 text-ink-soft">
        Public reference for carriers and campaign reviewers. This page describes every way end
        users consent to receive SMS from <strong className="text-ink">998 web designs</strong>{" "}
        (Bear LLC).
      </p>

      <div className="prose prose-sm mt-12 space-y-8 text-ink">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            1. Discovery form (website opt-in)
          </h2>
          <p className="text-ink-soft">
            <strong>URL:</strong>{" "}
            <a
              href="https://998webdesigns.com/book"
              className="text-accent underline hover:text-accent-deep"
            >
              https://998webdesigns.com/book
            </a>
          </p>
          <p className="mt-4 text-ink-soft">
            The user enters full name, email, and mobile phone, then must check an{" "}
            <strong>unchecked-by-default</strong> consent box before the form submits. Exact consent
            language on the form:
          </p>
          <blockquote className="mt-4 rounded-xl border border-rule bg-rule-soft/60 px-5 py-4 text-sm text-ink-soft">
            {BOOK_CONSENT_COPY} See our{" "}
            <Link href="/legal/privacy" className="text-accent underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/terms" className="text-accent underline">
              Terms of Service
            </Link>
            .
          </blockquote>
          <p className="mt-4 text-ink-soft">
            After submit, the user receives a one-time 6-digit verification code by SMS. They enter
            the code on the same site to confirm their number.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            2. Voice demo (verbal opt-in)
          </h2>
          <p className="text-ink-soft">
            <strong>URL:</strong>{" "}
            <a
              href="https://998webdesigns.com/"
              className="text-accent underline hover:text-accent-deep"
            >
              https://998webdesigns.com/
            </a>{" "}
            — click <strong>Talk to Jarvis</strong> (fixed button, bottom-right).
          </p>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-ink-soft">
            <li>User enters email and receives a one-time email verification code (not SMS).</li>
            <li>
              During the live voice conversation, Jarvis may ask for the user&apos;s US mobile
              number to complete their profile. Jarvis explains that an optional SMS may be used if
              they accept a promotional offer.
            </li>
            <li>
              The user speaks their number. Jarvis reads the digits back once and asks &ldquo;Is that
              correct?&rdquo;
            </li>
            <li>
              On <strong>yes</strong>, the system saves the number only when{" "}
              <code className="text-xs">smsConsent: true</code> is recorded — verbal agreement to
              save the number and possible future SMS.
            </li>
            <li>
              A one-time promotional code text is sent <strong>only if</strong> the user separately
              accepts the promo offer at the end of the call (never automatically on phone save).
            </li>
          </ol>
          <p className="mt-4 text-sm text-ink-soft">
            The Jarvis panel displays: &ldquo;Message and data rates may apply. Reply{" "}
            <strong>STOP</strong> to opt out. Reply <strong>HELP</strong> for help.&rdquo; with links
            to Privacy Policy and Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            3. Required disclosures (all paths)
          </h2>
          <ul className="list-inside list-disc space-y-2 text-ink-soft">
            <li>
              <strong>Program name:</strong> 998 web designs SMS Program
            </li>
            <li>
              <strong>Message frequency:</strong> Varies; typically one verification code per
              discovery session, plus occasional transactional texts for active clients.
            </li>
            <li>
              <strong>Message and data rates:</strong> Message and data rates may apply.
            </li>
            <li>
              <strong>Privacy Policy:</strong>{" "}
              <a
                href="https://998webdesigns.com/legal/privacy"
                className="text-accent underline hover:text-accent-deep"
              >
                https://998webdesigns.com/legal/privacy
              </a>{" "}
              (mobile numbers are not sold or shared with third parties for marketing).
            </li>
            <li>
              <strong>Terms of Service:</strong>{" "}
              <a
                href="https://998webdesigns.com/legal/terms"
                className="text-accent underline hover:text-accent-deep"
              >
                https://998webdesigns.com/legal/terms
              </a>
            </li>
            <li>
              <strong>Support:</strong> hello@998webdesigns.com
            </li>
            <li>
              <strong>Opt-out:</strong> Reply <strong>STOP</strong> to cancel. Reply{" "}
              <strong>HELP</strong> for help.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            4. What is not an SMS opt-in
          </h2>
          <p className="text-ink-soft">
            The lead form at{" "}
            <Link href="/start" className="text-accent underline">
              /start
            </Link>{" "}
            collects an optional phone number for project contact only. It does{" "}
            <strong>not</strong> include SMS consent and does not enroll users in the SMS program.
          </p>
        </section>
      </div>
    </main>
  );
}
