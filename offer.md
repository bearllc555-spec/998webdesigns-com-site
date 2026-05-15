# 998webdesigns — Offer & Business Model Spec

Drafted 2026-05-13 from an extended vision-chat session between Anthony and Claude. Captures the full product, sales, and operating model so it survives chat compaction. Decisions are categorized **Decided** (locked unless explicitly revisited) or **Open** (TBD before launch / before the first paying customer).

This doc is the product + business-model spec. `CLAUDE.md` is the operational/infrastructure handoff. The two are siblings — read both at the start of any 998webdesigns session.

---

## Strategic thesis (Decided 2026-05-13)

**998webdesigns is not a website business. It's a services business** — blogging, SEO, UGC video, and lead generation for small B2B — **that uses a $998 custom website as its customer-acquisition lead magnet.**

The $998 site does not need to be profitable on its own. It's CAC. The math is: what's the LTV across the upsell stack for the average customer, and is $998 a cheap enough acquisition cost to win on volume? A happy customer can ladder from $998 (or $98/mo) to $1.5K–$5K/mo across the four-service upsell stack over six to twelve months. That's where the real revenue lives.

**The unit economics are SaaS-shaped, not agency-shaped.** Each AI design agent handles 500+ customers simultaneously at near-zero marginal cost — the business is capped by demand, not by labor. That's a fundamentally different valuation profile than a services firm. (See "Scalability" under Production model.)

Three implications follow:

- **Production efficiency on the site matters more than craftsmanship.** The lead magnet gets templated aggressively. Customer perceives custom; production is closer to configure-not-build.
- **Round-2/3 concessions aren't "save the deal" — they're "lower the entry barrier."** Throwing in a free SEO audit isn't generosity; it's reducing CAC.
- **ICP narrows.** "Small B2B that needs a website" is too broad. The target is "small B2B with the budget and ambition to ALSO want blogging, SEO, UGC, lead gen." Trades work for the $998 hit; professional services tend to expand into recurring services.

---

## The lead magnet product: $998 web design

### Pricing (Decided)

**$998 once** is THE price. Custom design, hosting, 10-year domain registration. One-time fee, yours forever.

The $98/month option exists but is **NOT a parallel pricing tier visible on the splash**. It's a **round-3 closer concession** offered in private sales conversations when a prospect needs payment flexibility. Mechanics: $98/mo + $98 one-time setup, same product as the one-time tier. Year-one cost to the customer: $1,274. Break-even vs. the one-time tier hits at roughly month 10.

**Splash anchors on $998.** The page never advertises the monthly option.

**Conversion: monthly → lifetime.** Monthly customers can purchase the 10-year program at any time.

- **Open:** the conversion math (full $998 fresh vs. credit for prior months).
- **Open:** for $98/mo customers, whether the $10/year domain renewal is bundled or a passthrough.

### What's included in the $998 (Decided)

- Custom design built around the customer's business (templated + AI-driven; QA layer reviews before ship)
- Hosting (Cloudflare Pages — invisible to customer)
- 10-year domain registration
- Up to **6 pages** of marketing content
- A **/blog section** the customer can post to themselves (Decap CMS)
- **Privacy, Terms, 404** pages (legal/utility standards)
- **3 changes per month** after the onboarding phase ($10 per change beyond)
- Mobile-optimized, fast, accessible
- Click-to-call, click-to-map, contact form

### Page count rules (Decided)

**Cap:** 6 pages of marketing content.

**Outside the cap (don't count against the 6):** `/blog` (open-ended content), `/privacy`, `/terms`, `/404`.

**Beyond 6:** $98 per additional page.

- **Open:** definition of "a page" (long-scroll pages, services-with-children, blog post count).

### Changes policy (Decided)

- **3 changes per month included** after onboarding.
- **$10 per additional change** beyond 3 in any given month.
- **First month = onboarding/setup phase**, unlimited changes during this window.

- **Open:** definition of "a change."
- **Open:** when does onboarding end? Calendar (30 days from signup), milestone (customer signs off on live site), or hybrid.

### Blog mechanics (Decided)

**Included in the base $998 offer.** Every site comes with a `/blog` section the customer can post to themselves.

**Tech:** Decap CMS (headless, free, GitHub-backed). Customer logs in via an email/password auth proxy, writes posts in a Markdown editor, commits land in their GitHub repo, Cloudflare Pages rebuilds. Customer never touches Git.

**Friction-as-feature.** Posting is easy enough that motivated customers do it themselves. It's still clunky enough that less-motivated customers will hit "this is a chore" within a few weeks — and that's the trigger for the blog-writing upsell later.

---

## The design agents — brand-facing AI personas (Decided)

The three AI agents are the face of 998webdesigns. They are positioned and introduced as **website designers**, not sales agents. They appear in ads ("My name is Sarah. Let me design a website for you."), they handle outbound and inbound sales conversations, they lead the design phase with the customer, and they remain the customer's account person through the upsell stack. One persona, one relationship, from first impression to multi-year LTV.

### Designer framing, not sales agent (Decided 2026-05-13)

Sales agents are something prospects guard against. Designers are creative partners they collaborate with. A small business owner thinking "Sarah is helping me get my business online" is in a totally different posture than "Sarah is pitching me." This is the brand-defining positioning choice. The disclosure framing lands better too: "Hi, I'm Sarah, the AI designer at 998webdesigns" reads like tool-of-the-future, not "the AI bot that tries to sell you stuff."

### Disclosed AI as a brand asset (Decided 2026-05-13)

**Prospects know the agents are AI. Proudly, not buried.** "Hi, I'm Sarah, the AI designer from 998webdesigns. I built your mockup, want to walk through it?" That's the wow factor.

Owning "we use AI designers transparently" as a positioning play is asymmetric — most agencies will either hide it badly or fail to use AI at all. Being early AND transparent is the bold-but-defensible position.

### Three agents, A/B tested by SEQUENCE not individual (Decided)

There are three designer agents, each with a distinct video avatar, voice, name, and personality. The A/B test is NOT "which agent is the best closer." It's **"which SEQUENCE of agents wins for which vertical."**

Example: in plumbing, "Dave initiates → Susie follows up a week later" might close at 3x the rate of "Susie initiates → Dave follows up" or any single-agent path. That pattern only surfaces because the central DB tracks the full prospect journey across touchpoints.

Role specialization is the natural conclusion once the data reveals each agent's strength. Dave's scripts get optimized for the cold-open hook (warmth, energy, curiosity). Susie's scripts get optimized for the warm close (trust, technical depth, decision help). You stop training all three to do everything and start training each one to be best at their slot in the discovered "sales stack."

**Sample size:** sequence patterns probably need 300-500 completed handoff sequences per vertical before a pattern locks. Single-agent metrics can be read in 50; multi-agent sequences need real volume.

### Agent portfolios (Decided)

Each site built attributes to the agent who designed it. Sarah's portfolio grows with every project she ships. The central DB has an `agent_id` foreign key on every customer site. By year 2, "Sarah has designed 200+ sites for local businesses" is a hard-to-fake credibility signal that pays dividends in both ad creative and sales conversations.

### Agent assignment (Open)

There's a real tension to resolve. The designer framing pulls toward one-agent-per-customer ("Sarah is YOUR designer"). The sequence A/B test pulls toward multi-agent-per-prospect (Dave-then-Susie at 3x). Those are in tension. Two clean resolutions:

- **Ad-determined assignment** — you click Sarah's ad, Sarah designs your site, Sarah is yours forever. Strongest brand promise; sequence A/B testing only runs on cold-outbound prospects.
- **Designer-handoff framing** — Sarah is your primary, but if a week passes without a close, Susie introduces herself as "Sarah's colleague" and steps in. Preserves sequence testing while maintaining brand continuity through explicit handoff language. Closer to how human agencies actually work.

Either is defensible.

### The "actually a human" brand line (Decided 2026-05-13)

**Disclosed AI everywhere EXCEPT the escalation path.** When a customer asks to speak with a human, they get an actual human — not another AI persona. This stays true even at scale, even when commercial pressure tempts AI-ifying the escape valve too.

The brand discipline of meaning this is itself the differentiator. As more competitors blur the AI/human line, "actually a human when you need one" becomes a real product feature, not just an operational detail.

---

## The customer acquisition machine (Decided shape, Open details)

The acquisition motor has TWO top-of-funnel sources both feeding into ONE downstream agent-led experience.

### Two top-of-funnel sources

**1. Cold outbound (24/7 prospecting).** Automated identification, qualification, and scoring per vertical produces a database of qualified prospects with site/contact metadata. For each prospect, the auto-mockup engine builds a personalized site that mirrors their actual brand. Outbound email goes from one of the three designer agents with the personalized video avatar, embedded checkout link, phone number, and web chat link.

**2. Paid ads featuring the agents themselves.** Each agent stars in their own ad creative. "Hi, I'm Sarah — let me design a website for your business." Click-through lands on 998webdesigns.com, where the prospect fills out the **free mockup form** (extensive intake doubling as design brief). The same auto-mockup engine generates a personalized site from the form data. The prospect enters the same agent-led funnel cold-outbound prospects enter.

**One conversion target, two top-of-funnel sources, one persona end-to-end.**

### Mockup quality is the conversion lever

The difference between a mockup that makes the prospect say "wait, is this me?" and one that makes them say "this is generic AI-spam" is the entire ballgame on reply rates. Aggressive QA gates matter more than volume. Better mockups beat more mockups every time.

### The 4-channel unified design agent

Each prospect's assigned designer is reachable through four channels with full state continuity across all of them:

1. **Email with personalized video avatar** — one-way, async, push. The avatar addresses the prospect by name and references the mockup that was built for them.
2. **Direct checkout link** — embedded in the email. No conversation needed for ready buyers; one-click close.
3. **Phone number** — synchronous voice. Prospect-initiated v1 (legally simple, no TCPA exposure). Outbound AI calls deferred (real legal step up).
4. **Web chat on 998webdesigns.com** — async text, prospect-initiated. The chat agent always tries to close (checkout link in chat, escalation to phone/video on request, or contact info capture).

**Same agent identity across all four channels.** The avatar in the video is the same persona on the phone is the same persona in the chat. The agent reads from the central customer record on every interaction — "Glad you reached out — I just sent you the mockup, want to walk through it?" with full state from prior touchpoints.

### Sales conversation flow

When a prospect actively engages, the conversation runs through this sequencing:

1. **Round 1 pitch:** $998 design and deploy. This is the entire opening offer. Always.
2. **Round 2 concession** (if hesitation): pick a throw-in from the menu that fits the prospect. Frame as a bonus, not a discount — preserves the $998 anchor.
3. **Round 3 concession** (still hesitating): "$98/month with a $98 setup fee if a single upfront payment isn't workable." Frame as flexibility.
4. **If still no:** feedback survey → if recoverable, tailored counter-offer; if not, trickle-feed nurture.

### The 4-touch follow-up sequence (cold outbound)

- **Touch 1:** initial email with checkout link
- **Touch 2** (few days later): coupon code
- **Touch 3** (few days later): "schedule a call" with the agent
- **Touch 4** (few days later): more aggressive coupons / offers

### Round-2 concession menu (Decided)

Low-cost-to-deliver, high-perceived-value throw-ins. Pick whichever fits:

- **Free blog section** — already included in the $998, framed as a bonus
- **Free domain registration** — already bundled, useful framing when total-cost is the concern
- **Hosting credits — 1 month free** — useful for monthly conversions
- **Free SEO audit** — semrush/ahrefs free-tier scan, 60-90 min of analysis, delivered as a written report

Each throw-in does two jobs: moves a fence-sitter to yes AND seeds the eventual upsell.

### Feedback survey on no (Decided)

A no isn't a dead end — it's data. After Round 4, prospects who decline get a 10-question, **one-page**, no-trickery feedback survey. No fake "you've won a prize" tricks, no 30-page navigation hell.

**Question categories:** price, timing, trust, mockup fit, decision-maker, competitive, free-text ("what would have made this an easy yes?").

**Routing branches:**

1. **Recoverable** ("$998 was too much" / "want monthly" / "didn't love the mockup") → tailored counter-offer
2. **Unrecoverable now** ("redesigning in 12 months" / "working with someone currently") → trickle-feed with timing-aware messaging
3. **Disqualified** ("not the decision maker" / "in-house designer already") → removed from active pipeline

- **Open:** when exactly does the feedback fire — after Round 1 no (cuts off nurture), at end of 4-touch sequence (cleanest data), or both stages?
- **Open:** final 10-question set.

### Post-no trickle-feed nurture (Decided)

For "unrecoverable now" prospects: monthly trickle-feed email with **escalating offers**. A no today is a not-yet. They may be ready in 3, 6, or 12 months.

- **Open:** escalation curve.
- **Open:** age-out rule.
- **Open:** email infrastructure (Mailchimp, ConvertKit, Loops, custom). Manual works for first ~10 leads, breaks at 50.

### Always-available human escalation path (Decided 2026-05-13)

**Easy human access at any point in the journey.** At any time during the AI-led process, the customer can request to speak with a human. They immediately receive an email with a short form (couple of questions for triage) plus the option to schedule a meeting with an actual human.

- **Brand-protective.** Most AI-first companies fail because they hide humans behind layers of deflection. We invert it: human is the first option the moment the AI isn't doing the job. That counter-positions us against the "chatbot maze" pattern most prospects expect.
- **Escalation rate is a high-signal metric.** Every escalation trigger is data: at what point in the journey did the customer escalate? What was the prior AI conversation about? Was there a specific objection? Per-agent and per-vertical escalation rates inform training and script improvements.
- **The scheduled meeting is a closing surface, not just a save-the-relationship surface.** The human walks in with full AI conversation history + triage form context — that's a real upside conversion path, not just damage control.

**Meeting recordings + documentation feed the improvement loop.** Recorded meetings (with two-party-consent compliance via clear pre-call announcement) plus written documentation of decisions and learnings flow back into the central DB. The customer making this week's escalation call is helping shape next quarter's AI behavior.

- **Open:** who's the human, initially? Probably Anthony at first; a small team at scale. Either way they introduce themselves as "Sarah's colleague" or similar to preserve the "one human being" continuity through the handoff.

---

## The data spine — centralized customer database (Decided)

**All interactions across every channel are captured in a single centralized database, indexed by customer.** The DB is the spine that makes everything else work.

### Why it's the spine

Without unified data across channels:

- The "one human being" continuity across video/phone/chat/email collapses — the agent has no shared memory.
- The test-and-learn engine has no substrate to learn from.
- Sequence-pattern discovery (the "Dave-then-Susie at 3x" example) is impossible.
- The feedback-survey routing can't tie back to which touchpoint failed.

### Full feedback architecture — six structured signal sources

Every customer interaction generates structured improvement data:

| Source | What it reveals |
|---|---|
| Email logs | Content patterns, subject-line performance, click-through |
| Chat sessions | Objection patterns, closing motion success, where conversations stall |
| AI phone transcripts | AI failure modes, conversation flow gaps |
| Feedback surveys on no | Why prospects didn't convert |
| Human escalation recordings + documentation | What AI missed; how humans recovered |
| QA decisions with rationale | Production quality patterns; what to train against |

Nothing is lost to "it happened in a meeting and nobody wrote it down." That's a remarkably complete feedback architecture for a small-business services company — most agencies have at best three of those six, and the data lives in different tools that don't talk to each other.

### Why it's the most defensible long-term asset

Anyone can clone the surface — splash, $998 anchor, video avatars, agent personas, scripted flows. What no competitor can copy is years of prospect interaction data, conversation patterns, objection logs, feedback routing, recorded escalation calls — accumulated across thousands of conversations across multiple verticals.

Day 1 the DB has nothing useful. Day 365 it's a proprietary dataset that compounds. The asymmetry is what matters: a competitor entering year 3 can't catch up to your year-3 dataset. They'd have to either run their campaigns at lower conversion for years or buy your data. That's a real moat in a category where most agencies have none.

**Future agents (versions or new hires) read from the same customer record.** When the next iteration of the agent contacts a customer for the upsell pitch, it has full context. Continuity from CAC through LTV with one persona — and one data record — handling both.

### One vision-level constraint to bake in early

Prospects in some jurisdictions (California, Virginia, EU, UK) have legal right-to-delete on their data. The DB should support "delete every record for this prospect on request" as a primary operation, not a retrofit. Aligns with the "no trickery" brand thread.

---

## Test-and-learn framework (Decided)

Every metric is tracked. The system optimizes itself toward what works per vertical.

### Vertical selection as test design (Decided)

Multi-vertical from day one. The initial pick should optimize for **diversity of signal** — 4-5 verticals that are meaningfully different so the data tells you which CATEGORY converts. One trade, one professional service, one medical-local, one specialty contractor, maybe one local-retail. After 60-90 days the winners are clearly visible and you pour spend into them.

- **Open:** initial vertical set. Deferred to launch time per 2026-05-13. Plumbing is already wired; 2-3 others TBD.

### The 2D test space

Within each vertical, the variables are **template systems × offers**. Run 2-3 mockup templates AND 2-3 offer variants (round-2 throw-ins, coupon depths, subject lines). Be deliberate about which dimensions to test in parallel vs. sequentially — too many simultaneous variables give muddy data.

### Primary metric for expansion decisions

- **Open:** Reply rate (fastest signal, leading), close rate (revenue-tied, ~30-day lag), or LTV across the upsell stack (real answer, multi-month lag)? Different metric pushes toward different verticals.

### Vertical-specific "sales stacks" become the company IP

Each vertical, after enough data, produces a discovered, validated playbook: the optimal agent sequence + offer mix + mockup template + email copy + concession ladder that wins for that vertical. That stack is the company's IP. Year 1 the plumbing stack; then dental; then chiro. Each one is a piece of moat.

---

## The actual business: upsell stack (Decided shape, Open mechanics)

Where the real revenue lives. Pitched post-launch, weeks after the customer's site has settled and the post-purchase trust is established. **The same agent who closed the $998 deal continues as the designer through delivery and into the upsell relationship.** One persona, full lifecycle.

### The four upsells

1. **Blogging.** The agent's team writes one blog post per week on the customer's behalf. Pitched weeks after launch, when the empty blog has had time to feel like a gap. Recurring monthly.
2. **SEO.** Keyword research, on-page SEO, technical SEO, monthly reporting. Recurring or project.
3. **UGC videos from blog posts.** Content amplification — blog posts become 60-90s vertical videos for TikTok / IG Reels / YouTube Shorts. Smart compound play: the blog post is already paid for, so you're leveraging existing work into a second deliverable at low marginal cost.
4. **Lead generation — appointments booked to the calendar.** Highest-value layer, highest operational risk.

### LTV math

A happy customer can ladder from $98/mo (or $998 once) to $1.5K-$5K/mo over six to twelve months across this stack. That's where the real LTV lives; the $998 entry is the door-opener.

### Open mechanics

- **Open:** blog-upsell price ($198/mo floor, $298/mo ceiling for small B2B).
- **Open:** AI in the drafting loop, with disclosure standard.
- **Open:** topic ownership (customer-suggests vs. agent-pitches).
- **Open:** trigger rule for the blog upsell pitch (calendar vs. behavioral).
- **Open — lead-gen pricing shape.** "Appointments booked" is outcome-shaped, operationally different from blogging/SEO/UGC. Three pricing options: flat retainer (no guarantee), per-appointment (hard to scale at low volume), hybrid retainer + bonus. Pick before pitching.
- **Open:** UGC video posting ownership (create + post, or create + hand off).
- **Open:** sequencing of which upsell to pitch first.

---

## Production model (Decided 2026-05-13)

**Templated + AI-driven, with a QA layer reviewing before ship.** Anthony is NOT the production bottleneck — he's the quality gate at the strategic level, not the hands-on designer for every customer.

### The unified production engine

**The mockup engine and the delivery engine are the same engine.** Mockup = "what your site could look like, generated from scraping your existing brand." Delivery = "what your site IS, generated from the brief you filled out." Same machinery, different input source.

The plumbing-site-generator skill is the production heart of the business, generalized across verticals.

### Form as design brief (Decided 2026-05-13)

The extensive intake form does **double duty**: it pre-qualifies prospects for the $998 AND serves as the design brief. If the customer answers it well, design iteration is minimal.

The form has to gather more than qualifying signals — brand colors, logo, business hours, services list, pages required, photos/content, voice preferences, competitor sites they like.

### Phased QA model (Decided 2026-05-13)

**Phase 1:** Human sub-agents (contractors or small team) handle routine QA reviews. Anthony handles exceptions and strategic direction. This is the operating model until AI QA is mature.

**Phase 2:** AI QA agents take over routine reviews as they prove out, validated against the human QA labeled data. Humans handle the long tail of edge cases.

**The handoff is asymptotic, not a clean cut.** AI QA gets to 95% over time; the last 5% (edge cases, weird brand fits, judgment calls) stays human forever. That's fine — it's the steady state, not a failure to fully automate.

### The QA decision schema

Every review logs three things, not just the verdict:

- **Verdict:** approve / request revision / reject
- **Rationale:** why? what specifically?
- **Fix:** what was changed?

The rationale field is the high-leverage piece. Without it, you have approvals and rejections without context — useless for training. With it, you can train AI to recognize the patterns that triggered each human decision. Years of rich QA logs is the dataset that lets you confidently hand over to AI QA agents.

### QA-to-design feedback loop

When the QA layer rejects something, the rejection signal feeds back into the production engine as a prompt improvement so the same failure doesn't recur. QA becomes a one-way filter without this; with it, the production engine compounds its own quality over time.

### Scalability — SaaS-shaped unit economics

In a traditional agency, one designer handles 5-10 customers. Hiring more costs real money. Unit economics cap the business at the throughput of human designers.

In this model, one agent persona handles 500+ customers simultaneously. Marginal cost of customer 501 is roughly zero. The business isn't capped by labor; it's capped by demand. Recurring revenue from the upsell stack + near-zero marginal cost = software-like gross margins.

**Two architectural pieces have to actually hold for this scalability to be real:**

- **Context retrieval at concurrent load.** When the agent's on the phone with customer A while handling B on chat while reviewing a mockup with C — each customer needs to feel like the only customer. Fast DB reads, isolated session state, agent prompting discipline that doesn't bleed context across customers. Most prototypes work at low concurrency and break at scale.
- **QA throughput.** Production can generate 100 sites/day. The QA layer has to scale with it (per the phased model above), or the business hits a ceiling at Anthony's personal capacity to review.

The interesting consequence: **the only true constraint becomes demand generation.** If supply is effectively unlimited, ad spend and cold-outbound volume become the rate-limiter on revenue. Makes the test-and-learn machinery even more strategic.

### Onboarding flow (Decided)

Manual for the first few sales, then build provisioning machinery. As each manual onboarding happens, log each step in order — by customer #3 the spec for the eventual `provision-customer` script writes itself.

**Provisioning machinery (future).** A one-shot script or skill that takes a customer name + domain and provisions: GitHub repo from a template, Cloudflare Pages project, DNS records, Decap auth proxy, customer login.

### Post-sale delivery experience

- **Open:** the full customer experience from "paid $998" to "site is live." How the assigned designer agent handles the design-phase touchpoints. Whether iteration is one-shot ("here's your site, sign off") or N-rounds. Whether the agent proactively reaches out at key milestones (mockup ready, draft ready, launch ready) or the customer drives the cadence. Anthony flagged "we have to work on that" 2026-05-13 — the extensive intake form doing double duty as design brief should reduce iteration significantly if filled out well.

### Legal page generation

Either generate from a service like Termly or Iubenda (auto-fills customer name + jurisdiction) or keep your own boilerplate templates per business type. Cost-to-deliver near-zero either way.

- **Open:** pick the legal-page approach before the first sale.

---

## What's tracked elsewhere

- **Form capture** (extensive intake doubling as design brief, pre-qualifies for $998) — `whats-next.md` item 8; spec at `outputs/998webdesigns-form-capture-spec.md`. The form is the funnel entrance — needs to ship before any cold outbound or ad campaign launches.
- **Email infrastructure for trickle-feed nurture and outbound sequences** — `whats-next.md` item 12.
- **`hello@998webdesigns.com` real mailbox** — `whats-next.md` item 10.
- **Stripe payment rail** — `whats-next.md` item 11. Prerequisite for in-email checkout link.
- **Schema.org JSON-LD + 1200x630 og:image polish** — `whats-next.md` item 9.

---

## Decision log

| Date | Decision |
|---|---|
| 2026-05-13 | Initial offer spec captured from vision-chat session. |
| 2026-05-13 | Pricing reframed: $998 as primary anchor (not parallel tier). $98/mo as round-3 closer concession. |
| 2026-05-13 | Sales conversation flow defined: form → Round 1 → Round 2 throw-in → Round 3 monthly → trickle-feed if no. |
| 2026-05-13 | Round-2 concession menu: free blog, free domain registration, 1 month hosting credit, free SEO audit. |
| 2026-05-13 | Post-no trickle-feed nurture: monthly cadence, escalating offers. |
| 2026-05-13 | Upsell roadmap is the four-service stack: blogging, SEO, UGC videos, lead generation. Lead-gen outcome-shaped risk flagged as Open. |
| 2026-05-13 | Splash confirmed: anchors on $998 only; never advertises the monthly option. |
| 2026-05-13 | **Strategic reframe: 998webdesigns is a services business; the $998 site is a customer-acquisition lead magnet.** Upsell stack is the actual business. |
| 2026-05-13 | Multi-vertical expansion: pick several verticals, test-and-learn which convert, expand into winners using learned techniques. Initial set deferred to launch. |
| 2026-05-13 | Cold-outbound acquisition motor: 24/7 prospecting → personalized mockup → email/video/phone/chat → 4-touch follow-up. |
| 2026-05-13 | Three virtual agents A/B tested by SEQUENCE not individual performance. Vertical-specific "sales stacks" are the company IP. |
| 2026-05-13 | **Disclosed AI as the brand-defining play** — wow factor, not compliance afterthought. |
| 2026-05-13 | Four-channel unified virtual agent: email-with-video, embedded checkout, phone, web chat. Same agent identity across all four. |
| 2026-05-13 | Feedback survey on no: 10 questions, one page, no trickery. Routes recoverable / unrecoverable / disqualified. |
| 2026-05-13 | Centralized customer database: all emails, logs, phone transcripts, chat sessions, recordings captured per customer. Memory + learning + moat. Right-to-delete by design. |
| 2026-05-13 | Production model: templated + AI-driven, QA layer reviews before ship. Mockup engine and delivery engine are the same engine. |
| 2026-05-13 | Extensive intake form does double duty as $998 pre-qualifier AND design brief. |
| 2026-05-13 | **Agents are positioned as DESIGNERS, not sales agents.** Brand-defining frame shift. |
| 2026-05-13 | Agents appear in paid ads — second top-of-funnel motion alongside cold outbound. Same agent personality across both. |
| 2026-05-13 | Each agent owns the portfolio of sites they design. `agent_id` attribution on every customer site. Compounding brand asset. |
| 2026-05-13 | Agent assignment flagged Open: ad-determined ("Sarah is yours forever") vs. designer-handoff framing ("Sarah's colleague Susie steps in") — both defensible. |
| 2026-05-13 | Unit economics are SaaS-shaped, not agency-shaped. One agent handles 500+ customers simultaneously. Business is capped by demand, not labor. |
| 2026-05-13 | Phased QA model: human sub-agents first, AI QA agents once at 100% confidence. Asymptotic handoff. Decision schema captures verdict + rationale + fix. QA-to-design feedback loop. |
| 2026-05-13 | Always-available human escalation: email with 2-question triage form + scheduled meeting. Brand-protective. |
| 2026-05-13 | Escalation meetings are recorded (with two-party-consent compliance) and documented to feed back into the improvement loop. |
| 2026-05-13 | **"Actually a human" at the escalation point is a permanent brand discipline.** Disclosed AI everywhere EXCEPT the escalation path. The escape valve stays human by design even at scale. |
| 2026-05-13 | Full feedback architecture across six structured signal sources: email, chat, AI phone, post-no surveys, escalation recordings, QA decisions. Most-complete feedback loop in the small-B2B services category. |
