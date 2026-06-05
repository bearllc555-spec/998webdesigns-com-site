import type { Metadata } from "next";
import { Design1Artboard } from "@/components/temp/artboards/Design1Artboard";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../linkedin-banner.css";
import "../linkedin-export.css";

export const metadata: Metadata = {
  title: { absolute: `LinkedIn banner export — Design 1 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})` },
  robots: { index: false, follow: false },
};

export default function TempExportPage() {
  return (
    <div className="temp-page linkedin-export-page">
      <div className="linkedin-export-canvas">
        <Design1Artboard />
      </div>
      <p className="linkedin-export-caption">
        Design 1 — <strong>{LINKEDIN_COVER_UPLOAD_W}×{LINKEDIN_COVER_UPLOAD_H}px</strong>. Screenshot
        this rectangle or use your browser&apos;s full-page capture for LinkedIn upload.
      </p>
    </div>
  );
}
