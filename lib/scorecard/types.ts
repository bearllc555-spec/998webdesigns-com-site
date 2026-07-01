export type ScorecardVerdict = "good" | "warning" | "danger";

export type ScorecardSignal = {
  key: string;
  name: string;
  points: number | null;
  max_points: number;
  line: string;
  source: "tool" | "manual";
  source_name: string;
  sort_order: number;
  locked: boolean;
};

export type ScorecardReport = {
  id?: string;
  domain: string;
  business_name: string;
  score: number;
  verdict: ScorecardVerdict;
  competitor_name: string | null;
  competitor_score: number | null;
  tested_on: string;
  created_at?: string;
  source_door: string | null;
  /** Client homepage capture (Supabase Storage). */
  site_screenshot_url?: string | null;
  /** Analysis report page capture — fallback if site shot missing. */
  screenshot_url?: string | null;
};

export type ScorecardReportPayload = {
  report: ScorecardReport;
  signals: ScorecardSignal[];
};

export type ScorecardFormPayload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  domain?: string;
};
