/** Shared flow policy — onboarding seed, tool-block messages, client vs model ownership. */

export type VoiceDemoOnboardingSeed = {
  nameOnFile: string | null;
  nameSaved: boolean;
  savedName: string;
};

/**
 * Seed client refs when CRM already has full_name (returning visitor).
 * nameSaved is false until save_name runs this session — avoids silent skip of post-name greeting.
 */
export function seedOnboardingFromFullName(
  fullName: string | null | undefined
): VoiceDemoOnboardingSeed {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) {
    return { nameOnFile: null, nameSaved: false, savedName: "" };
  }
  return { nameOnFile: trimmed, nameSaved: false, savedName: trimmed };
}

/** Model must not call confirm_weather_zip — client already staged the ZIP. */
export const TOOL_BLOCKED_CONFIRM_WEATHER_ZIP =
  "Client already staged this ZIP. Wait for [zip-staged] and speak spokenConfirm only — do not call confirm_weather_zip again.";

/** Model must not call lookup_weather — client already fetched weather. */
export const TOOL_BLOCKED_LOOKUP_WEATHER =
  "Client already fetched weather. Speak briefReport from the [weather-lookup-ready] cue only — do not call lookup_weather.";

/** Model must never call lookup_weather — client fetches after ZIP yes. */
export const TOOL_DELEGATE_LOOKUP_TO_CLIENT =
  "Do not call lookup_weather — the client fetches weather after ZIP confirmation. Wait for [weather-lookup-ready] and speak spokenLookup then briefReport verbatim.";

/** Promo must wait until close queue reaches the coupon step. */
export const TOOL_BLOCKED_PROMO_WEATHER =
  "Promo is last in the close queue. Finish weather (ZIP + forecast), then cool reaction, then implement ask, then offer the coupon — do not call send_promo_email yet.";
