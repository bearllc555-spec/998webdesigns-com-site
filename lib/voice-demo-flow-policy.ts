/** Shared flow policy — onboarding seed, client vs model ownership. */

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
