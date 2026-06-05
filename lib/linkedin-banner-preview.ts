/** Upload file LinkedIn expects (max quality). */
export const LINKEDIN_COVER_UPLOAD_W = 1584;
export const LINKEDIN_COVER_UPLOAD_H = 396;

/**
 * Desktop profile intro card — main column width on linkedin.com/in/… (not the
 * full 1128px feed). Cover is 4:1 inside this card; LinkedIn scales the upload
 * down to fit, which makes the photo overlap feel larger than a wide mockup.
 */
export const LINKEDIN_PROFILE_CARD_W = 804;
export const LINKEDIN_COVER_DISPLAY_W = LINKEDIN_PROFILE_CARD_W;
export const LINKEDIN_COVER_DISPLAY_H = Math.round(LINKEDIN_PROFILE_CARD_W / 4);

/** Profile photo on desktop intro (px at display scale). */
export const LINKEDIN_AVATAR_SIZE = 152;
export const LINKEDIN_AVATAR_LEFT = 24;
export const LINKEDIN_AVATAR_BORDER = 4;

/** Bottom edge of cover — center of avatar sits here (half overlaps banner). */
export const LINKEDIN_AVATAR_OVERLAP_PX = LINKEDIN_AVATAR_SIZE / 2;

export const BANNER_DESIGN_ROUTES = [
  { previewHref: "/temp", exportHref: "/temp/export", label: "Design 1" },
  { previewHref: "/temp/2", exportHref: "/temp/2/export", label: "Design 2" },
  { previewHref: "/temp/3", exportHref: "/temp/3/export", label: "Design 3" },
  { previewHref: "/temp/4", exportHref: "/temp/4/export", label: "Design 4" },
] as const;
