import { describe, expect, it } from "vitest";
import {
  detectZipCityDrift,
  extractZipReadbackCity,
  shouldInterruptZipCityDrift,
  summarizeVoiceDemoOpsWarnings,
} from "@/lib/voice-demo-ops";

const TOTOWA_STAGED = {
  zip: "07512",
  city: "Totowa",
  stateName: "New Jersey",
  spokenConfirm:
    "I have ZIP code 0 7 5 1 2 for Totowa, New Jersey. Is that correct?",
};

const LITTLE_FALLS_STAGED = {
  zip: "07424",
  city: "Little Falls",
  stateName: "New Jersey",
  spokenConfirm:
    "I have ZIP code 0 7 4 2 4 for Little Falls, New Jersey. Is that correct?",
};

describe("voice-demo-ops zip city drift", () => {
  it("extracts city from ZIP read-back", () => {
    expect(
      extractZipReadbackCity(
        "I have ZIP code 0 7 5 1 2 for Paterson, New Jersey. Is that correct?"
      )
    ).toBe("Paterson");
  });

  it("flags Paterson drift for 07512", () => {
    const result = detectZipCityDrift(
      "I have ZIP code 0 7 5 1 2 for Paterson, New Jersey. Is that correct?",
      TOTOWA_STAGED
    );
    expect(result.drift).toBe(true);
    expect(result.heardCity).toBe("Paterson");
    expect(result.selfCorrected).toBe(false);
  });

  it("flags self-correction when Paterson then Totowa appear", () => {
    const result = detectZipCityDrift(
      "Sorry — I have ZIP code 0 7 5 1 2 for Paterson, New Jersey. Actually Totowa, New Jersey. Is that correct?",
      TOTOWA_STAGED
    );
    expect(result.drift).toBe(true);
    expect(result.selfCorrected).toBe(true);
  });

  it("passes correct Totowa read-back", () => {
    const result = detectZipCityDrift(TOTOWA_STAGED.spokenConfirm, TOTOWA_STAGED);
    expect(result.drift).toBe(false);
  });

  it("flags Ramsey drift for 07424 Little Falls", () => {
    const result = detectZipCityDrift(
      "ZIP 07424 for Ramsey, New Jersey — let me confirm that.",
      LITTLE_FALLS_STAGED
    );
    expect(result.drift).toBe(true);
    expect(result.heardCity).toBe("Ramsey");
  });

  it("interrupts streaming wrong city before correction", () => {
    expect(
      shouldInterruptZipCityDrift(
        "I have ZIP code 0 7 5 1 2 for Paterson, New Jersey",
        TOTOWA_STAGED
      )
    ).toBe(true);
    expect(
      shouldInterruptZipCityDrift(
        "I have ZIP code 0 7 5 1 2 for Totowa, New Jersey",
        TOTOWA_STAGED
      )
    ).toBe(false);
  });
});

describe("voice-demo-ops CRM summary", () => {
  it("summarizes warn events", () => {
    const summary = summarizeVoiceDemoOpsWarnings([
      {
        at: "2026-06-07T12:00:00.000Z",
        kind: "zip_city_drift",
        severity: "warn",
        message: "Jarvis said Paterson for 07512",
      },
    ]);
    expect(summary).toContain("zip_city_drift");
    expect(summary).toContain("Paterson");
  });
});
