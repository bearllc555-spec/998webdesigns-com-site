const props = [
  {
    title: "Designed by experienced designers",
    body: "No templates. No AI slop. A real designer working on your site by hand, like a craftsperson.",
  },
  {
    title: "Delivered in 5–7 business days",
    body: "The clock starts the moment your deposit clears. You'll see the first draft inside a week.",
  },
  {
    title: "No agencies. No retainers. No surprises.",
    body: "One fixed price. Edits priced clearly. Hosting on your terms. You always know what you're paying for.",
  },
];

export function ValueProps() {
  return (
    <section className="border-b border-rule bg-rule-soft/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-6 md:grid-cols-3 md:gap-7">
          {props.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-rule bg-bg p-7 shadow-sm"
            >
              <h3 className="font-display text-xl font-medium leading-snug">{p.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
