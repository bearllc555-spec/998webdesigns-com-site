# If "Save changes" won't work on Supabase GitHub settings

The Pro / Branching banner is **not** the blocker.

## Try this reset (2 minutes)

1. On Integrations, click **Disable integration** (GitHub section) and confirm.
2. Refresh the page.
3. Connect GitHub again → pick **`998webdesigns-com-site`**.
4. **Working directory:** `.` (one period — not `/`, not `supabase`).
5. **Deploy to production:** ON · **Production branch:** `main`.
6. Click **Enable integration** (first-time button) or **Save changes**.

## Use the right Save button

There are two cards on the page. Only the **GitHub** card's **Save changes** applies to GitHub. The **Vercel** card has its own Save for env prefix — ignore that unless you're editing Vercel.

## Optional — skip entirely

Vercel ↔ helmet is already connected. The site does not need this GitHub form to work.
