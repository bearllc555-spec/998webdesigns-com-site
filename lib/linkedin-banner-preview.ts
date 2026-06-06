/** Upload file LinkedIn expects (max quality). */
export const LINKEDIN_COVER_UPLOAD_W = 1584;
export const LINKEDIN_COVER_UPLOAD_H = 396;

/**
 * Measured on https://www.linkedin.com/in/anthony-de-meo-285999397/ @ 1536×695 viewport
 * (see design/linkedin-banner/linkedin-live-measurements.json).
 */
export const LINKEDIN_PROFILE_CARD_W = 792;
export const LINKEDIN_COVER_DISPLAY_W = LINKEDIN_PROFILE_CARD_W;
export const LINKEDIN_COVER_DISPLAY_H = 198;

/** Outer frame (figure) — 160×160 on live profile. */
export const LINKEDIN_AVATAR_FRAME_SIZE = 160;
/** Inner photo — 152×152 inside the frame. */
export const LINKEDIN_AVATAR_SIZE = 152;
/** Offset from card left edge to photo frame (220 − 196 = 28). */
export const LINKEDIN_AVATAR_LEFT = 28;
export const LINKEDIN_AVATAR_BORDER = 4;
/** How far the photo extends upward into the cover (274 − 178 = 96). */
export const LINKEDIN_AVATAR_OVERLAP_PX = 96;

/** LinkedIn scales 1584-wide upload to 792 display (exactly 50%). */
export const LINKEDIN_DISPLAY_SCALE = LINKEDIN_COVER_DISPLAY_W / LINKEDIN_COVER_UPLOAD_W;

/** Synced from live profile — anthony-de-meo-285999397 (updated 2026-06-06). */
export const LINKEDIN_AVATAR_IMAGE_SRC = "/temp/anthony-linkedin-avatar.jpg?v=20260606";

/** 32px gap after photo frame right edge — brand/logo safe on 1584×396 artboard. */
export const LINKEDIN_ARTBOARD_CONTENT_PAD_LEFT = Math.ceil(
  (LINKEDIN_AVATAR_LEFT + LINKEDIN_AVATAR_FRAME_SIZE + 32) / LINKEDIN_DISPLAY_SCALE
);

/** Offer panel copy — keep in sync across /temp banner artboards. */
export const LINKEDIN_BANNER_OFFER_KICKER = "20% off";
export const LINKEDIN_BANNER_OFFER_CODE = "use code LINKEDIN20";
export const LINKEDIN_BANNER_LIST_PRICE = "$5,998";
export const LINKEDIN_BANNER_PROMO_PRICE = "$4,798";

export const BANNER_DESIGN_ROUTES = [
  { previewHref: "/temp", exportHref: "/temp/export", label: "Design 1" },
  { previewHref: "/temp/2", exportHref: "/temp/2/export", label: "Design 2" },
  { previewHref: "/temp/3", exportHref: "/temp/3/export", label: "Design 3" },
  { previewHref: "/temp/4", exportHref: "/temp/4/export", label: "Design 4" },
] as const;
