import type { Metadata } from "next";
import { BannerImageExportView } from "@/components/temp/BannerImageExportView";
import {
  BANNER_FEATURE_ROUTES,
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";
import "../../../linkedin-export.css";

const feature = BANNER_FEATURE_ROUTES[0];

export const metadata: Metadata = {
  title: {
    absolute: `LinkedIn banner export — Feature 1 (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})`,
  },
  robots: { index: false, follow: false },
};

export default function TempFeature1ExportPage() {
  return (
    <BannerImageExportView
      designLabel="Feature 1"
      imageSrc={feature.imageSrc}
      fileName="linkedin-banner-feature-1.png"
    />
  );
}
