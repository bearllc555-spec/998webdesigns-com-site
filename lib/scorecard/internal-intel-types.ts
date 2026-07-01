export type AwwwardsIntel = {
  ok: boolean;
  listed?: boolean;
  search_url?: string;
  profile_url?: string | null;
  title?: string | null;
  summary?: string;
  error?: string | null;
};

export type WebsiteRatingCategory = {
  name: string;
  score?: string | number | null;
  note?: string | null;
};

export type WebsiteRatingIntel = {
  ok: boolean;
  source_url?: string;
  audit_url?: string;
  overall_score?: string | number | null;
  visitor_reaction?: string | null;
  top_fix?: string | null;
  categories?: WebsiteRatingCategory[];
  raw?: unknown;
  error?: string | null;
};

export type ScorecardInternalIntel = {
  fetched_at?: string;
  awwwards?: AwwwardsIntel;
  websiterating?: WebsiteRatingIntel;
};
