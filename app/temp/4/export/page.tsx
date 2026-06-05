import type { Metadata } from "next";
import { Design4Artboard } from "@/components/temp/artboards/Design4Artboard";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../linkedin-banner-d4.css";
import "../../linkedin-export.css";

export const metadata: Metadata = {
  title: { absolute: `LinkedIn banner export — Design 4 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})` },
  robots: { index: false, follow: false },
};

export default function TempV4ExportPage() {
  return (
    <div className="temp-page-v4 linkedin-export-page">
      <div className="linkedin-export-canvas">
        <Design4Artboard />
      </div>
      <p className="linkedin-export-caption">
        Design 4 — <strong>{LINKEDIN_COVER_UPLOAD_W}×{LINKEDIN_COVER_UPLOAD_H}px</strong>. Screenshot
        this rectangle for LinkedIn upload.
      </p>
    </div>
  );
}
