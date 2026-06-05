import type { Metadata } from "next";
import { Design4Artboard } from "@/components/temp/artboards/Design4Artboard";
import { BannerExportView } from "@/components/temp/BannerExportView";
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
    <BannerExportView
      designLabel="Design 4"
      pageClassName="temp-page-v4"
      fileName="linkedin-banner-design-4.png"
    >
      <Design4Artboard />
    </BannerExportView>
  );
}
