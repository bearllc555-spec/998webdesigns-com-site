"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";

export const metadata: Metadata = {
  title: "Privacy Policy — 998 web designs",
  description: "Privacy policy for 998 web designs",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="font-display text-4xl font-bold text-ink md:text-5xl">
          Privacy Policy
        </h1>

        <div className="prose prose-sm mt-12 space-y-8 text-ink">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              1. Introduction
            </h2>
            <p className="text-ink-soft">
              998 web designs ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              2. Information We Collect
            </h2>
            <p className="text-ink-soft">
              We may collect information about you in a variety of ways. The information we may collect on the site includes:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the site or when you choose to participate in various activities related to the site.
              </li>
              <li>
                <strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase products or services from the site.
              </li>
              <li>
                <strong>Data From Social Networks:</strong> User information from social networks, including your name, your social network username, location, gender, birth date, email address, profile picture, and public data for contacts, if you connect your account to such social networks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              3. Use of Your Information
            </h2>
            <p className="text-ink-soft">
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>Generate a personal profile about you so that future visits to the site will be personalized as possible</li>
              <li>Increase the efficiency and operation of the site</li>
              <li>Monitor and analyze usage and trends to improve your experience with the site</li>
              <li>Notify you of updates to the site</li>
              <li>Offer new products, services, and/or recommendations to you</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. Disclosure of Your Information
            </h2>
            <p className="text-ink-soft">
              We may share your information in the following situations:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>
                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to comply with the law, to enforce our site policies, or to protect ours or others' rights, property, and safety.
              </li>
              <li>
                <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              5. Security of Your Information
            </h2>
            <p className="text-ink-soft">
              We use administrative, technical, and physical security measures to protect your personal information. However, perfect security does not exist on the Internet, so we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Contact Us
            </h2>
            <p className="text-ink-soft">
              If you have questions or comments about this Privacy Policy, please{" "}
              <button
                onClick={() => setContactOpen(true)}
                className="text-accent underline hover:text-accent-deep transition"
              >
                get in touch with us
              </button>
              {" "}or contact us at:
            </p>
            <p className="mt-4 text-ink-soft">
              <strong>998 web designs</strong>
              <br />
              Email:{" "}
              <a href="mailto:hello@998webdesigns.com" className="text-accent underline hover:text-accent-deep">
                hello@998webdesigns.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Changes to This Privacy Policy
            </h2>
            <p className="text-ink-soft">
              998 web designs reserves the right to modify this privacy policy at any time. Please review this Privacy Policy periodically, and especially before you provide any personal information. Your continued use of the site following the posting of revised Privacy Policy means that you accept and agree to the changes.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}
