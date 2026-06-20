import Link from "next/link";

type Props = {
  fullName: string;
  whenLabel: string;
};

export function DiscoveryScheduleConfirmed({ fullName, whenLabel }: Props) {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  return (
    <>
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">You&apos;re all set</h1>
      <p className="mt-4 text-ink-soft">
        Hi {firstName} - your discovery call is booked for{" "}
        <strong className="font-medium text-ink">{whenLabel}</strong>.
      </p>
      <p className="mt-4 text-sm text-ink-soft">
        We&apos;ll walk through scope, hosting, and add-ons on the call. Afterward we&apos;ll email you a
        personalized checkout link.
      </p>
      <p className="mt-8 text-sm text-slate">
        Need to change the time? Use the reschedule link in your Calendly confirmation email, or write{" "}
        <Link href="mailto:hello@998webdesigns.com" className="text-accent underline">
          hello@998webdesigns.com
        </Link>
        .
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink"
      >
        Back to site
      </Link>
    </>
  );
}
