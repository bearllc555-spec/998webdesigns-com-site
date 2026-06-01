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

        <div className="prose prose-sm mt-12 space-y-8 text-ink">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              1. Agreement to Terms
            </h2>
            <p className="text-ink-soft">
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              2. Use License
            </h2>
            <p className="text-ink-soft">
              Permission is granted to temporarily download one copy of the materials (information or software) on 998 web designs' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-ink-soft">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              3. Disclaimer
            </h2>
            <p className="text-ink-soft">
              The materials on 998 web designs' website are provided on an 'as is' basis. 998 web designs makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              4. Limitations
            </h2>
            <p className="text-ink-soft">
              In no event shall 998 web designs or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on 998 web designs' website, even if 998 web designs or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              5. Accuracy of Materials
            </h2>
            <p className="text-ink-soft">
              The materials appearing on 998 web designs' website could include technical, typographical, or photographic errors. 998 web designs does not warrant that any of the materials on its website are accurate, complete, or current. 998 web designs may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              6. Links
            </h2>
            <p className="text-ink-soft">
              998 web designs has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by 998 web designs of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              7. Modifications
            </h2>
            <p className="text-ink-soft">
              998 web designs may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              8. Governing Law
            </h2>
            <p className="text-ink-soft">
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which 998 web designs operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              9. Contact Information
            </h2>
            <p className="text-ink-soft">
              If you have any questions about these Terms of Service, please{" "}
              <button
                onClick={() => setContactOpen(true)}
                className="text-accent underline hover:text-accent-deep transition"
              >
                get in touch with us
              </button>
              {" "}or email{" "}
              <Image
                src="/email-address.jpg"
                alt="email address: hello@998webdesigns.com"
                width={160}
                height={34}
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
