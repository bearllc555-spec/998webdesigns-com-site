import type { Metadata } from "next";
import { Design3Artboard } from "@/components/temp/artboards/Design3Artboard";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../linkedin-banner-manhattan.css";
import "../../linkedin-export.css";

export const metadata: Metadata = {
  title: { absolute: `LinkedIn banner export — Design 3 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})` },
  robots: { index: false, follow: false },
};

export default function TempV3ExportPage() {
  return (
    <div className="temp-page-v3 linkedin-export-page">
      <div className="linkedin-export-canvas">
        <Design3Artboard />
      </div>
      <p className="linkedin-export-caption">
        Design 3 — <strong>{LINKEDIN_COVER_UPLOAD_W}×{LINKEDIN_COVER_UPLOAD_H}px</strong>. Screenshot
        this rectangle for LinkedIn upload.
      </p>
    </div>
  );
}
