/** Typical Door 2 generation time (PageSpeed + crawl + screenshots). */
export const SCORECARD_ESTIMATE_SEC =
  Math.max(15, Number(process.env.SCORECARD_ESTIMATE_SEC ?? "60") || 60);

export const SCORECARD_POLL_MAX_SEC =
  Math.max(SCORECARD_ESTIMATE_SEC, Number(process.env.SCORECARD_POLL_MAX_SEC ?? "180") || 180);

/** User-facing max wait (matches browser poll timeout). */
export const SCORECARD_MAX_WAIT_MIN = Math.ceil(SCORECARD_POLL_MAX_SEC / 60);
