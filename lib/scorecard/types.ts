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
  domain: string;
  business_name: string;
  score: number;
  verdict: ScorecardVerdict;
  competitor_name: string | null;
  competitor_score: number | null;
  tested_on: string;
  source_door: string | null;
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
