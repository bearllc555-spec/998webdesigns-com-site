# LinkedIn banner — 998 webdesigns

## Live previews

| Design | URL | Notes |
|--------|-----|-------|
| 1 | https://998webdesigns.com/temp | Bricolage + Inter |
| 2 | https://998webdesigns.com/temp/2 | Geist + Inter, Manhattan, **blue gradient offer** (locked) |
| 3 | https://998webdesigns.com/temp/3 | Same as 2 + **frosted glass offer** |

New iterations → `/temp/4`, `/temp/5`, … Add a row in `components/temp/BannerDesignNav.tsx`.

## v3 (`linkedin-banner-v3.html`)

Design aligned with the live site:

- **Colors:** `#2563EB` accent, ink `#0A0A0A`, Mercury-clean white field
- **Type:** Bricolage Grotesque (display / offer) + Inter (supporting) — closer to the site’s Geist display feel than the old banner font
- **Layout:** Left padding clears the LinkedIn profile photo; offer stays on the right
- **Offer:** `7-day builds · $1,998 flat` + `998webdesigns.com`

## Export for LinkedIn

**Live previews** scale to LinkedIn’s desktop cover width (~1128px) and show a profile-photo overlap mockup.

1. Open https://998webdesigns.com/temp or `/temp/2` — preview matches how the cover looks on a LinkedIn profile.
2. For the upload file, capture or export at **1584×396** (full artboard), or screenshot only the cover strip inside the white card if that matches your workflow.
3. Legacy HTML: open `linkedin-banner-v3.html` in Chrome (double-click or drag into browser).
4. Capture **only** the 1584×396 white banner (not the gray page chrome):
   - **Windows:** Snipping Tool / Snip & Sketch — region capture, or DevTools device mode at 1584×396.
   - **Optional:** Print → Save as PDF → crop, or use Figma import at 1584×396.
3. Upload to LinkedIn → **Profile** → banner image.
4. Check on desktop and mobile — adjust copy in the HTML if anything sits under the avatar.

## Safe zone

Text starts ~300px from the left so it clears the circular profile photo on personal profiles.
