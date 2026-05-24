// Single source-of-truth for the site version label.
// BUMP THIS BY ONE ON EVERY COMMIT TO MAIN.
// Convention: zero-padded two digits — v01, v02, ... v09, v10, v11.
// Why: deploy-propagation tell. After shipping, glance at the live site, confirm
// the number bumped. Catches stale edge caches and failed builds at a glance.
// Rendered in Nav (header) + Footer.
export const SITE_VERSION = "v46";
