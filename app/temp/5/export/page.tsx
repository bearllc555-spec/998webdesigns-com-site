import type { Metadata } from "next";
import { Design5Artboard } from "@/components/temp/artboards/Design5Artboard";
import { BannerExportView } from "@/components/temp/BannerExportView";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../linkedin-banner-manhattan-clean.css";
import "../../linkedin-export.css";

export const metadata: Metadata = {
  title: { absolute: `LinkedIn banner export — Design 5 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})` },
  robots: { index: false, follow: false },
};

export default function TempV5ExportPage() {
  return (
    <BannerExportView
      designLabel="Design 5"
      pageClassName="temp-page-v5"
      fileName="linkedin-banner-design-5.png"
    >
      <Design5Artboard />
    </BannerExportView>
  );
}
