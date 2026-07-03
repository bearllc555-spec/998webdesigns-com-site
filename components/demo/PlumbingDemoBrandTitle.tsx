import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_FICTITIOUS_SUFFIX,
} from "@/lib/voice-demo-plumbing-constants";

type PlumbingDemoBrandTitleProps = {
  /** Page header uses lg; widget card uses sm. */
  size?: "page" | "widget";
  className?: string;
};

export function PlumbingDemoBrandTitle({
  size = "page",
  className,
}: PlumbingDemoBrandTitleProps) {
  const nameSize = size === "page" ? "text-lg" : "text-sm";
  const suffixSize = size === "page" ? "text-sm" : "text-xs";

  return (
    <span className={className}>
      <span className={`font-display font-semibold ${nameSize}`}>
        {PLUMBING_DEMO_BUSINESS_NAME}
      </span>
      <span className={`ml-1 font-normal ${suffixSize} text-ink-soft`}>
        {PLUMBING_DEMO_FICTITIOUS_SUFFIX}
      </span>
    </span>
  );
}
