# Field notes — content backlog and schedule

**Cadence:** 2 posts per month · **Publish:** Tuesday or Wednesday before 10am ET · **Voice:** operator-direct, brand-neutral (see [README.md](./README.md))

After each publish: run `npm run blog:notify -- <slug>` (records in CRM + Telegram with post link).

---

## 2026 schedule

| Publish date | Status | Slug (planned) | Bucket | Title |
|---|---|---|---|---|
| 2026-06-05 | **Live** | `google-business-profile-checklist` | Local search / GBP | Google Business Profile checklist for local service businesses |
| 2026-06-06 | **Live** | `what-you-get-for-5998` | Website decisions | What $5,998 buys for a local business website (and what it does not) |
| 2026-06-07 | **Live** | `serenity-spa-booking-first-site` | Portfolio / proof | Booking-first website design for a spa: what Serenity Spa prioritized |
| 2026-06-18 Wed | Draft | `contractor-site-pages` | Website decisions | 5 pages every contractor site needs (and 3 you can skip) |
| 2026-07-02 Wed | Planned | `review-request-script` | Local search / GBP | How to ask for Google reviews without sounding desperate |
| 2026-07-16 Wed | Planned | `tuscano-excavating-case-study` | Portfolio / proof | Tuscano Excavating: a site built for emergency calls and trust |
| 2026-07-30 Wed | Planned | `mobile-site-speed` | Website decisions | Why your site loads slow on mobile (and what to fix first) |
| 2026-08-13 Wed | Planned | `when-website-cant-fix-sales` | Ops / hiring psychology | What a website cannot fix (and what to fix before you buy traffic) |
| 2026-08-27 Wed | Planned | `local-seo-basics` | Local search / GBP | Local SEO basics: citations, NAP, and service-area pages |
| 2026-09-10 Wed | Planned | `borst-landscape-case-study` | Portfolio / proof | Borst Landscape: showing finished work before the first call |
| 2026-09-24 Wed | Planned | `diy-builder-vs-custom` | Website decisions | Wix vs custom: an honest comparison for local service businesses |
| 2026-10-08 Wed | Planned | `answer-the-phone` | Ops / hiring psychology | The phone still rings: what happens after someone clicks your number |

---

## Topic rotation (repeat after post 12)

1. **Local search / GBP** — checklists, reviews, map pack
2. **Website decisions** — pricing logic, pages, mobile, DIY vs custom
3. **Portfolio / proof** — one build walkthrough per cycle (link live demo)
4. **Ops / hiring psychology** — follow-up, when a site is not enough

---

## Draft queue (titles only — pick next from top)

- "Why your homepage hero does not need a carousel"
- "Service-area pages: when they help and when they are spam"
- "Jet VIP Charter: luxury service, mobile-first booking path"
- "How long should a local business blog post be?"
- "Google Profile posts vs blog posts: what each is for"

---

## Publish checklist

1. Create `content/blog/{slug}.md` with frontmatter + body
2. `npm run build` (optional local sanity check)
3. Bump `SITE_VERSION` in `lib/version.ts`
4. Commit + push to `main`
5. **`npm run blog:notify -- {slug}`** — CRM Blog row + Telegram link
6. Optional: LinkedIn pull-quote + link same day

First-time setup (once per environment): `POST /api/admin/migrate-blog-posts` with `BALANCE_CAPTURE_SECRET` to create the `blog_posts` table.
