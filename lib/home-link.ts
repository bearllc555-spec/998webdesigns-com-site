import type { MouseEvent } from "react";

/** Next.js same-route Link to `/` does not clear the hash; use on logo/home clicks. */
export function onHomeLogoClick(
  e: MouseEvent<HTMLAnchorElement>,
  pathname: string
) {
  if (pathname !== "/" || !window.location.hash) return;
  e.preventDefault();
  window.history.replaceState(null, "", "/");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
