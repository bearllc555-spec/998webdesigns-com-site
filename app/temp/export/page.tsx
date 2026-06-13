import type { Metadata } from "next";
import { Design1Artboard } from "@/components/temp/artboards/Design1Artboard";
import { BannerExportView } from "@/components/temp/BannerExportView";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../linkedin-banner.css";
import "../linkedin-export.css";

export const metadata: Metadata = {
  title: { absolute: `LinkedIn banner export - Design 1 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})` },
  robots: { index: false, follow: false },
};

export default function TempExportPage() {
  return (
    <BannerExportView
      designLabel="Design 1"
      pageClassName="temp-page"
      fileName="linkedin-banner-design-1.png"
    >
      <Design1Artboard />
    </BannerExportView>
  );
}
