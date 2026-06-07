# 998 Field notes — editorial rules

Voice: **operator-direct, brand-neutral.**

## Do

- Lead with the reader's problem, not a vendor pitch.
- Use second person ("your Google Business Profile") not first-person plural ("we tell clients").
- Be specific — numbers, timelines, tradeoffs, honest limits.
- Link internally to `/pricing`, `/portfolio`, or `/start` when relevant (sparingly in body).
- End every post with the standard CTA block (handled by the template — do not duplicate in markdown).

## Don't

- Open with "At 998 web designs…" or similar brand-first framing.
- Weave sales copy through the body.
- Use generic marketing filler ("unlock growth potential", "digital presence").

## File format

One file per post: `content/blog/{slug}.md`

```yaml
---
title: "Post title"
description: "One sentence for SEO and cards — max ~160 chars."
publishedAt: "2026-06-07"
updatedAt: "2026-06-07"   # optional
author: "998 web designs"
tags: ["local-seo", "google-business"]
featured: false           # optional — pins to top of index
---
```

Body is standard Markdown. Internal links: `/start`, `/pricing`, `/portfolio`, `/blog/other-slug`.

## Attribution

Author line shows in schema/metadata as "998 web designs" — attribution only, not voice.
