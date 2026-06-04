// Single source-of-truth for the site version label.
// BUMP THIS BY ONE TENTH ON EVERY CHANGE.
// Convention: v18.1, v18.2, v18.3, etc.
// Why: deploy-propagation tell. After shipping, glance at the live site, confirm
// the number bumped. Catches stale edge caches and failed builds at a glance.
// Rendered in Nav (header) + Footer.
export const SITE_VERSION = "v32.4";
