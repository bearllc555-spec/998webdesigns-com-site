import { PLUMBING_DEMO_CAPABILITY_GROUPS } from "@/lib/voice-demo-plumbing-capabilities";

export function PlumbingDemoCapabilities() {
  return (
    <section
      className="mt-10 rounded-2xl border border-rule bg-bg px-5 py-6 sm:px-6"
      aria-labelledby="plumbing-demo-capabilities-heading"
    >
      <div className="space-y-3">
        <h2
          id="plumbing-demo-capabilities-heading"
          className="font-display text-lg font-semibold text-ink"
        >
          What Jarvis can handle
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Just talk naturally — like you would with a real receptionist. Ask about your problem,
          pricing, emergencies, or say you want to book. Jarvis has been programmed with Metro
          Plumbing &amp; Drain&apos;s full knowledge base, including everything below (and he can
          book appointments and send confirmation emails in this demo).
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          If he is not confident in an answer, he will not guess — he will take your name and phone
          number and have someone from the team call you back.
        </p>
        <p className="text-sm text-ink-soft">
          You do not need to read these word-for-word. They are here so you know what he is capable
          of.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {PLUMBING_DEMO_CAPABILITY_GROUPS.map((group) => (
          <details
            key={group.id}
            className="group rounded-xl border border-rule bg-rule-soft/30 open:bg-bg"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span>{group.title}</span>
                <span className="text-xs font-normal text-ink-soft">
                  {group.questions.length} topic{group.questions.length === 1 ? "" : "s"}
                </span>
              </span>
            </summary>
            <ul className="space-y-2 border-t border-rule px-4 py-3">
              {group.questions.map((question) => (
                <li
                  key={question}
                  className="text-sm leading-relaxed text-ink-soft before:mr-2 before:text-accent before:content-['•']"
                >
                  {question}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
